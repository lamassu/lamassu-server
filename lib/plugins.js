const _ = require('lodash/fp')
const argv = require('minimist')(process.argv.slice(2))
const crypto = require('crypto')
const pgp = require('pg-promise')()
const dateFormat = require('dateformat')

const BN = require('./bn')
const dbm = require('./postgresql_interface')
const db = require('./db')
const logger = require('./logger')
const logs = require('./logs')
const T = require('./time')
const configManager = require('./new-config-manager')
const ticker = require('./ticker')
const wallet = require('./wallet')
const exchange = require('./exchange')
const sms = require('./sms')
const email = require('./email')
const cashOutHelper = require('./cash-out/cash-out-helper')
const machineLoader = require('./machine-loader')
const customers = require('./customers')
const coinUtils = require('./coin-utils')
const commissionMath = require('./commission-math')
const promoCodes = require('./promo-codes')

const { cassetteMaxCapacity } = require('./constants')

const notifier = require('./notifier')

const mapValuesWithKey = _.mapValues.convert({
  cap: false
})

const TRADE_TTL = 2 * T.minutes
const STALE_TICKER = 3 * T.minutes
const STALE_BALANCE = 3 * T.minutes
const PONG_TTL = '1 week'
const tradesQueues = {}

function plugins (settings, deviceId) {

  function internalBuildRates (tickers, withCommission = true) {
    const localeConfig = configManager.getLocale(deviceId, settings.config)
    const cryptoCodes = localeConfig.cryptoCurrencies

    const rates = {}

    cryptoCodes.forEach((cryptoCode, i) => {
      const rateRec = tickers[i]
      const commissions = configManager.getCommissions(cryptoCode, deviceId, settings.config)

      if (!rateRec) return

      const cashInCommission = BN(1).add(BN(commissions.cashIn).div(100))

      const cashOutCommission = _.isNil(commissions.cashOut)
        ? undefined
        : BN(1).add(BN(commissions.cashOut).div(100))

      if (Date.now() - rateRec.timestamp > STALE_TICKER) return logger.warn('Stale rate for ' + cryptoCode)
      const rate = rateRec.rates

      withCommission ? rates[cryptoCode] = {
        cashIn: rate.ask.mul(cashInCommission).round(5),
        cashOut: cashOutCommission && rate.bid.div(cashOutCommission).round(5)
      } : rates[cryptoCode] = {
        cashIn: rate.ask.round(5),
        cashOut: rate.bid.round(5)
      }
    })
    return rates
  }

  function buildRatesNoCommission (tickers) {
    return internalBuildRates(tickers, false)
  }

  function buildRates (tickers) {
    return internalBuildRates(tickers, true)
  }

  function getNotificationConfig () {
    return configManager.getGlobalNotifications(settings.config)
  }

  function buildBalances (balanceRecs) {
    const localeConfig = configManager.getLocale(deviceId, settings.config)
    const cryptoCodes = localeConfig.cryptoCurrencies

    const balances = {}

    cryptoCodes.forEach((cryptoCode, i) => {
      const balanceRec = balanceRecs[i]
      if (!balanceRec) return logger.warn('No balance for ' + cryptoCode + ' yet')
      if (Date.now() - balanceRec.timestamp > STALE_BALANCE) return logger.warn('Stale balance for ' + cryptoCode)

      balances[cryptoCode] = balanceRec.balance
    })

    return balances
  }

  function isZeroConf (tx) {
    const walletSettings = configManager.getWalletSettings(tx.cryptoCode, settings.config)
    const zeroConfLimit = walletSettings.zeroConfLimit || 0
    return tx.fiat.lte(zeroConfLimit)
  }

  function computeAvailableCassettes (cassettes, redeemableTxs) {
    if (_.isEmpty(redeemableTxs)) return cassettes

    const sumTxs = (sum, tx) => {
      const bills = tx.bills
      const sameDenominations = a => a[0].denomination === a[1].denomination
      const doDenominationsMatch = _.every(sameDenominations, _.zip(cassettes, bills))

      if (!doDenominationsMatch) {
        throw new Error('Denominations don\'t add up, cassettes were changed.')
      }

      return _.map(r => r[0] + r[1].provisioned, _.zip(sum, tx.bills))
    }

    const provisioned = _.reduce(sumTxs, [0, 0], redeemableTxs)
    const zipped = _.zip(_.map('count', cassettes), provisioned)
    const counts = _.map(r => r[0] - r[1], zipped)

    if (_.some(_.lt(_, 0), counts)) {
      throw new Error('Negative note count: %j', counts)
    }

    return [
      {
        denomination: cassettes[0].denomination,
        count: counts[0]
      },
      {
        denomination: cassettes[1].denomination,
        count: counts[1]
      }
    ]
  }

  function buildAvailableCassettes (excludeTxId) {
    const cashOutConfig = configManager.getCashOut(deviceId, settings.config)

    if (!cashOutConfig.active) return Promise.resolve()

    const denominations = [cashOutConfig.top, cashOutConfig.bottom]

    const virtualCassettes = [Math.max(cashOutConfig.top, cashOutConfig.bottom) * 2]

    return Promise.all([dbm.cassetteCounts(deviceId), cashOutHelper.redeemableTxs(deviceId, excludeTxId)])
      .then(([rec, _redeemableTxs]) => {
        const redeemableTxs = _.reject(_.matchesProperty('id', excludeTxId), _redeemableTxs)

        const counts = argv.cassettes
          ? argv.cassettes.split(',')
          : rec.counts

        const cassettes = [
          {
            denomination: parseInt(denominations[0], 10),
            count: parseInt(counts[0], 10)
          },
          {
            denomination: parseInt(denominations[1], 10),
            count: parseInt(counts[1], 10)
          }
        ]

        try {
          return {
            cassettes: computeAvailableCassettes(cassettes, redeemableTxs),
            virtualCassettes
          }
        } catch (err) {
          logger.error(err)
          return {
            cassettes,
            virtualCassettes
          }
        }
      })
  }

  function fetchCurrentConfigVersion () {
    const sql = `select id from user_config
  where type=$1
  and valid
  order by id desc
  limit 1`

    return db.one(sql, ['config'])
      .then(row => row.id)
  }

  function mapCoinSettings (coinParams) {
    const cryptoCode = coinParams[0]
    const cryptoNetwork = coinParams[1]
    const commissions = configManager.getCommissions(cryptoCode, deviceId, settings.config)
    const minimumTx = BN(commissions.minimumTx)
    const cashInFee = BN(commissions.fixedFee)
    const cashInCommission = BN(commissions.cashIn)
    const cashOutCommission = _.isNumber(commissions.cashOut) ? BN(commissions.cashOut) : null
    const cryptoRec = coinUtils.getCryptoCurrency(cryptoCode)

    return {
      cryptoCode,
      display: cryptoRec.display,
      minimumTx: BN.max(minimumTx, cashInFee),
      cashInFee,
      cashInCommission,
      cashOutCommission,
      cryptoNetwork
    }
  }

  function pollQueries (serialNumber, deviceTime, deviceRec, machineVersion, machineModel) {
    const localeConfig = configManager.getLocale(deviceId, settings.config)

    const fiatCode = localeConfig.fiatCurrency
    const cryptoCodes = localeConfig.cryptoCurrencies

    const tickerPromises = cryptoCodes.map(c => ticker.getRates(settings, fiatCode, c))
    const balancePromises = cryptoCodes.map(c => fiatBalance(fiatCode, c))
    const testnetPromises = cryptoCodes.map(c => wallet.cryptoNetwork(settings, c))
    const pingPromise = recordPing(deviceTime, machineVersion, machineModel)
    const currentConfigVersionPromise = fetchCurrentConfigVersion()
    const currentAvailablePromoCodes = promoCodes.getNumberOfAvailablePromoCodes()

    const promises = [
      buildAvailableCassettes(),
      pingPromise,
      currentConfigVersionPromise
    ].concat(tickerPromises, balancePromises, testnetPromises, currentAvailablePromoCodes)

    return Promise.all(promises)
      .then(arr => {
        const cassettes = arr[0]
        const configVersion = arr[2]
        const cryptoCodesCount = cryptoCodes.length
        const tickers = arr.slice(3, cryptoCodesCount + 3)
        const balances = arr.slice(cryptoCodesCount + 3, 2 * cryptoCodesCount + 3)
        const testNets = arr.slice(2 * cryptoCodesCount + 3, arr.length - 1)
        const coinParams = _.zip(cryptoCodes, testNets)
        const coinsWithoutRate = _.map(mapCoinSettings, coinParams)
        const areThereAvailablePromoCodes = arr[arr.length - 1] > 0

        return {
          cassettes,
          rates: buildRates(tickers),
          balances: buildBalances(balances),
          coins: _.zipWith(_.assign, coinsWithoutRate, tickers),
          configVersion,
          areThereAvailablePromoCodes
        }
      })
  }

  function sendCoins (tx) {
    return wallet.sendCoins(settings, tx)
  }

  function recordPing (deviceTime, version, model) {
    const devices = {
      version,
      model,
      last_online: deviceTime
    }

    return Promise.all([
      db.none(`insert into machine_pings(device_id, device_time) values($1, $2) 
            ON CONFLICT (device_id) DO UPDATE SET device_time = $2, updated = now()`, [deviceId, deviceTime]),
      db.none(pgp.helpers.update(devices, null, 'devices') + 'WHERE device_id = ${deviceId}', {
        deviceId
      })
    ])
  }

  function isHd (tx) {
    return wallet.isHd(settings, tx)
  }

  function getStatus (tx) {
    return wallet.getStatus(settings, tx, deviceId)
  }

  function newAddress (tx) {
    const info = {
      cryptoCode: tx.cryptoCode,
      label: 'TX ' + Date.now(),
      account: 'deposit',
      hdIndex: tx.hdIndex,
      cryptoAtoms: tx.cryptoAtoms,
      isLightning: tx.isLightning
    }
    return wallet.newAddress(settings, info, tx)
  }

  function dispenseAck (tx) {
    const cashOutConfig = configManager.getCashOut(deviceId, settings.config)
    const cassettes = [cashOutConfig.top, cashOutConfig.bottom]

    return dbm.addDispense(deviceId, tx, cassettes)
  }

  function fiatBalance (fiatCode, cryptoCode) {
    const commissions = configManager.getCommissions(cryptoCode, deviceId, settings.config)
    return Promise.all([
      ticker.getRates(settings, fiatCode, cryptoCode),
      wallet.balance(settings, cryptoCode)
    ])
      .then(([rates, balanceRec]) => {
        if (!rates || !balanceRec) return null

        const rawRate = rates.rates.ask
        const cashInCommission = BN(1).minus(BN(commissions.cashIn).div(100))
        const balance = balanceRec.balance

        if (!rawRate || !balance) return null

        const rate = rawRate.div(cashInCommission)

        const lowBalanceMargin = BN(1.03)

        const cryptoRec = coinUtils.getCryptoCurrency(cryptoCode)
        const unitScale = cryptoRec.unitScale
        const shiftedRate = rate.shift(-unitScale)
        const fiatTransferBalance = balance.mul(shiftedRate).div(lowBalanceMargin)

        return {
          timestamp: balanceRec.timestamp,
          balance: fiatTransferBalance.truncated().toString()
        }
      })
  }

  function notifyConfirmation (tx) {
    logger.debug('notifyConfirmation')

    const phone = tx.phone
    const timestamp = dateFormat(new Date(), 'UTC:HH:MM Z')
    const rec = {
      sms: {
        toNumber: phone,
        body: `Your cash is waiting! Go to the Cryptomat and press Redeem within 24 hours. [${timestamp}]`
      }
    }

    return sms.sendMessage(settings, rec)
      .then(() => {
        const sql = 'update cash_out_txs set notified=$1 where id=$2'
        const values = [true, tx.id]

        return db.none(sql, values)
      })
  }

  function notifyOperator (tx, rec) {
    // notify operator about new transaction and add high volume txs to database
    return notifier.transactionNotify(tx, rec)
  }

  function clearOldLogs () {
    return logs.clearOldLogs()
      .catch(logger.error)
  }

  function pong () {
    return db.none(`UPDATE server_events SET created=now() WHERE event_type=$1;
       INSERT INTO server_events (event_type) SELECT $1
       WHERE NOT EXISTS (SELECT 1 FROM server_events WHERE event_type=$1);`, ['ping'])
      .catch(logger.error)
  }

  /*
   * Trader functions
   */

  function buy (rec, tx) {
    return buyAndSell(rec, true, tx)
  }

  function sell (rec) {
    return buyAndSell(rec, false)
  }

  function buyAndSell (rec, doBuy, tx) {
    const cryptoCode = rec.cryptoCode
    const fiatCode = rec.fiatCode
    const cryptoAtoms = doBuy ? commissionMath.fiatToCrypto(tx, rec, deviceId, settings.config) : rec.cryptoAtoms.neg()

    const market = [fiatCode, cryptoCode].join('')

    if (!exchange.active(settings, cryptoCode)) return

    const direction = doBuy ? 'cashIn' : 'cashOut'
    const internalTxId = tx ? tx.id : rec.id
    logger.debug('[%s] Pushing trade: %d', market, cryptoAtoms)
    if (!tradesQueues[market]) tradesQueues[market] = []
    tradesQueues[market].push({
      direction,
      internalTxId,
      fiatCode,
      cryptoAtoms,
      cryptoCode,
      timestamp: Date.now()
    })
  }

  function consolidateTrades (cryptoCode, fiatCode) {
    const market = [fiatCode, cryptoCode].join('')

    const marketTradesQueues = tradesQueues[market]
    if (!marketTradesQueues || marketTradesQueues.length === 0) return null

    logger.debug('[%s] tradesQueues size: %d', market, marketTradesQueues.length)
    logger.debug('[%s] tradesQueues head: %j', market, marketTradesQueues[0])

    const t1 = Date.now()

    const filtered = marketTradesQueues
      .filter(tradeEntry => {
        return t1 - tradeEntry.timestamp < TRADE_TTL
      })

    const filteredCount = marketTradesQueues.length - filtered.length

    if (filteredCount > 0) {
      tradesQueues[market] = filtered
      logger.debug('[%s] expired %d trades', market, filteredCount)
    }

    if (filtered.length === 0) return null

    const partitionByDirection = _.partition(({ direction }) => direction === 'cashIn')
    const [cashInTxs, cashOutTxs] = _.compose(partitionByDirection, _.uniqBy('internalTxId'))(filtered)

    const cryptoAtoms = filtered
      .reduce((prev, current) => prev.plus(current.cryptoAtoms), BN(0))

    const timestamp = filtered.map(r => r.timestamp).reduce((acc, r) => Math.max(acc, r), 0)

    const consolidatedTrade = {
      cashInTxs,
      cashOutTxs,
      fiatCode,
      cryptoAtoms,
      cryptoCode,
      timestamp
    }

    tradesQueues[market] = []

    logger.debug('[%s] consolidated: %j', market, consolidatedTrade)
    return consolidatedTrade
  }

  function executeTrades () {
    return machineLoader.getMachines()
      .then(devices => {
        const deviceIds = devices.map(device => device.deviceId)
        const lists = deviceIds.map(deviceId => {
          const localeConfig = configManager.getLocale(deviceId, settings.config)
          const fiatCode = localeConfig.fiatCurrency
          const cryptoCodes = localeConfig.cryptoCurrencies

          return cryptoCodes.map(cryptoCode => ({
            fiatCode,
            cryptoCode
          }))
        })

        const tradesPromises = _.uniq(_.flatten(lists))
          .map(r => executeTradesForMarket(settings, r.fiatCode, r.cryptoCode))

        return Promise.all(tradesPromises)
      })
      .catch(logger.error)
  }

  function executeTradesForMarket (settings, fiatCode, cryptoCode) {
    if (!exchange.active(settings, cryptoCode)) return

    const market = [fiatCode, cryptoCode].join('')
    const tradeEntry = consolidateTrades(cryptoCode, fiatCode)

    if (tradeEntry === null || tradeEntry.cryptoAtoms.eq(0)) return

    return executeTradeForType(tradeEntry)
      .catch(err => {
        tradesQueues[market].push(tradeEntry)
        if (err.name === 'orderTooSmall') return logger.debug(err.message)
        logger.error(err)
      })
  }

  function executeTradeForType (_tradeEntry) {
    const expand = te => _.assign(te, {
      cryptoAtoms: te.cryptoAtoms.abs(),
      type: te.cryptoAtoms.gte(0) ? 'buy' : 'sell'
    })

    const tradeEntry = expand(_tradeEntry)
    const execute = tradeEntry.type === 'buy' ? exchange.buy : exchange.sell

    return recordTrade(tradeEntry)
      .then(newEntry =>
        execute(settings, tradeEntry, newEntry.id)
          .catch(err => {
            updateTradeEntry(tradeEntry, newEntry, err)
              .then(() => {
                console.log(err)
                throw err
              })
          })
      )
  }

  function updateTradeEntry (tradeEntry, newEntry, err) {
    const data = mergeTradeEntryAndError(tradeEntry, err)
    const sql = pgp.helpers.update(data, ['error'], 'trades') + ` WHERE id = ${newEntry.id}`
    return db.none(sql)
  }

  function recordTradeAndTx (tradeId, { cashInTxs, cashOutTxs }, dbTx) {
    const columnSetCashIn = new pgp.helpers.ColumnSet(['tx_id', 'trade_id'], { table: 'cashin_tx_trades' })
    const columnSetCashOut = new pgp.helpers.ColumnSet(['tx_id', 'trade_id'], { table: 'cashout_tx_trades' })
    const mapToEntry = _.map(tx => ({ tx_id: tx.internalTxId, trade_id: tradeId }))
    const queries = []

    if (!_.isEmpty(cashInTxs)) {
      const query = pgp.helpers.insert(mapToEntry(cashInTxs), columnSetCashIn)
      queries.push(dbTx.none(query))
    }
    if (!_.isEmpty(cashOutTxs)) {
      const query = pgp.helpers.insert(mapToEntry(cashOutTxs), columnSetCashOut)
      queries.push(dbTx.none(query))
    }
    return Promise.all(queries)
  }

  function convertBigNumFields (obj) {
    const convert = (value, key) => _.includes(key, ['cryptoAtoms', 'fiat'])
      ? value.toString()
      : value

    const convertKey = key => _.includes(key, ['cryptoAtoms', 'fiat'])
      ? key + '#'
      : key

    return _.mapKeys(convertKey, mapValuesWithKey(convert, obj))
  }

  function mergeTradeEntryAndError (tradeEntry, error) {
    if (error && error.message) {
      return Object.assign({}, tradeEntry, {
        error: error.message.slice(0, 200)
      })
    }
    return tradeEntry
  }

  function recordTrade (_tradeEntry, error) {
    const massage = _.flow(
      mergeTradeEntryAndError,
      _.pick(['cryptoCode', 'cryptoAtoms', 'fiatCode', 'type', 'error']),
      convertBigNumFields,
      _.mapKeys(_.snakeCase)
    )
    const tradeEntry = massage(_tradeEntry, error)
    const sql = pgp.helpers.insert(tradeEntry, null, 'trades') + 'RETURNING *'
    db.tx(t => {
      return t.oneOrNone(sql)
        .then(newTrade => recordTradeAndTx(newTrade.id, _tradeEntry, t))
    })
  }

  function sendMessage (rec) {
    const notifications = configManager.getGlobalNotifications(settings.config)

    let promises = []
    if (notifications.email.active && rec.email) promises.push(email.sendMessage(settings, rec))
    if (notifications.sms.active && rec.sms) promises.push(sms.sendMessage(settings, rec))

    return Promise.all(promises)
  }

  function checkDevicesCashBalances (fiatCode, devices) {
    return _.map(device => checkDeviceCashBalances(fiatCode, device), devices)
  }

  function checkDeviceCashBalances (fiatCode, device) {
    const cashOutConfig = configManager.getCashOut(device.deviceId, settings.config)
    const denomination1 = cashOutConfig.top
    const denomination2 = cashOutConfig.bottom
    const cashOutEnabled = cashOutConfig.active

    const notifications = configManager.getNotifications(null, device.deviceId, settings.config)

    const machineName = device.name

    const cashInAlert = device.cashbox > notifications.cashInAlertThreshold
      ? {
        code: 'CASH_BOX_FULL',
        machineName,
        deviceId: device.deviceId,
        notes: device.cashbox
      }
      : null

    const cassette1Alert = cashOutEnabled && (device.cassette1 / cassetteMaxCapacity) < notifications.fillingPercentageCassette1
      ? {
        code: 'LOW_CASH_OUT',
        cassette: 1,
        machineName,
        deviceId: device.deviceId,
        notes: device.cassette1,
        denomination: denomination1,
        fiatCode
      }
      : null

    const cassette2Alert = cashOutEnabled && (device.cassette2 / cassetteMaxCapacity) < notifications.fillingPercentageCassette2
      ? {
        code: 'LOW_CASH_OUT',
        cassette: 2,
        machineName,
        deviceId: device.deviceId,
        notes: device.cassette2,
        denomination: denomination2,
        fiatCode
      }
      : null

    return _.compact([cashInAlert, cassette1Alert, cassette2Alert])
  }

  function checkCryptoBalances (fiatCode, devices) {
    const fiatBalancePromises = cryptoCodes => _.map(c => fiatBalance(fiatCode, c), cryptoCodes)

    const fetchCryptoCodes = _deviceId => {
      const localeConfig = configManager.getLocale(_deviceId, settings.config)
      return localeConfig.cryptoCurrencies
    }

    const union = _.flow(_.map(fetchCryptoCodes), _.flatten, _.uniq)
    const cryptoCodes = union(devices)
    const checkCryptoBalanceWithFiat = _.partial(checkCryptoBalance, [fiatCode])

    return Promise.all(fiatBalancePromises(cryptoCodes))
      .then(balances => _.map(checkCryptoBalanceWithFiat, _.zip(cryptoCodes, balances)))
  }

  function checkCryptoBalance (fiatCode, rec) {
    const [cryptoCode, fiatBalance] = rec
    if (!fiatBalance) return null

    const notifications = configManager.getNotifications(cryptoCode, null, settings.config)
    const lowAlertThreshold = notifications.cryptoLowBalance
    const highAlertThreshold = notifications.cryptoHighBalance

    const req = {
      cryptoCode,
      fiatBalance,
      fiatCode
    }

    if (_.isFinite(lowAlertThreshold) && BN(fiatBalance.balance).lt(lowAlertThreshold)) {
      return _.set('code')('LOW_CRYPTO_BALANCE')(req)
    }

    if (_.isFinite(highAlertThreshold) && BN(fiatBalance.balance).gt(highAlertThreshold)) {
      return _.set('code')('HIGH_CRYPTO_BALANCE')(req)
    }

    return null
  }

  function checkBalances () {
    const localeConfig = configManager.getGlobalLocale(settings.config)
    const fiatCode = localeConfig.fiatCurrency

    return machineLoader.getMachines()
      .then(devices => {
        return Promise.all([
          checkCryptoBalances(fiatCode, devices),
          checkDevicesCashBalances(fiatCode, devices)
        ])
          .then(_.flow(_.flattenDeep, _.compact))
      })
  }

  function randomCode () {
    return BN(crypto.randomBytes(3).toString('hex'), 16).shift(-6).toFixed(6).slice(-6)
  }

  function getPhoneCode (phone) {
    const code = argv.mockSms
      ? '123'
      : randomCode()

    const rec = {
      sms: {
        toNumber: phone,
        body: 'Your cryptomat code: ' + code
      }
    }

    return sms.sendMessage(settings, rec)
      .then(() => code)
  }

  function sweepHdRow (row) {
    const cryptoCode = row.crypto_code

    return wallet.sweep(settings, cryptoCode, row.hd_index)
      .then(txHash => {
        if (txHash) {
          logger.debug('[%s] Swept address with tx: %s', cryptoCode, txHash)

          const sql = `update cash_out_txs set swept='t'
      where id=$1`

          return db.none(sql, row.id)
        }
      })
      .catch(err => logger.error('[%s] Sweep error: %s', cryptoCode, err.message))
  }

  function sweepHd () {
    const sql = `select id, crypto_code, hd_index from cash_out_txs
  where hd_index is not null and not swept and status in ('confirmed', 'instant')`

    return db.any(sql)
      .then(rows => Promise.all(rows.map(sweepHdRow)))
      .catch(err => logger.error(err))
  }

  function getMachineNames () {
    return machineLoader.getMachineNames(settings.config)
  }

  function getRawRates () {
    const localeConfig = configManager.getGlobalLocale(settings.config)
    const fiatCode = localeConfig.fiatCurrency

    const cryptoCodes = configManager.getAllCryptoCurrencies(settings.config)
    const tickerPromises = cryptoCodes.map(c => ticker.getRates(settings, fiatCode, c))

    return Promise.all(tickerPromises)
  }

  function getRates () {
    return getRawRates()
      .then(buildRates)
  }

  return {
    getRates,
    buildRates,
    getRawRates,
    buildRatesNoCommission,
    pollQueries,
    sendCoins,
    newAddress,
    isHd,
    isZeroConf,
    getStatus,
    dispenseAck,
    getPhoneCode,
    executeTrades,
    pong,
    clearOldLogs,
    notifyConfirmation,
    sweepHd,
    sendMessage,
    checkBalances,
    getMachineNames,
    buildAvailableCassettes,
    buy,
    sell,
    getNotificationConfig,
    notifyOperator,
    fetchCurrentConfigVersion
  }
}

module.exports = plugins
