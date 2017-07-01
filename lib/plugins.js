const uuid = require('uuid')
const _ = require('lodash/fp')
const argv = require('minimist')(process.argv.slice(2))
const crypto = require('crypto')
const pgp = require('pg-promise')()

const BN = require('./bn')
const dbm = require('./postgresql_interface')
const db = require('./db')
const logger = require('./logger')
const T = require('./time')
const configManager = require('./config-manager')
const ticker = require('./ticker')
const wallet = require('./wallet')
const exchange = require('./exchange')
const sms = require('./sms')
const email = require('./email')
const cashOutHelper = require('./cash-out-helper')
const machineLoader = require('./machine-loader')
const coinUtils = require('./coin-utils')

const mapValuesWithKey = _.mapValues.convert({cap: false})

const TRADE_TTL = 2 * T.minutes
const STALE_TICKER = 3 * T.minutes
const STALE_BALANCE = 3 * T.minutes
const PONG_TTL = '1 week'
const tradesQueues = {}

const coins = coinUtils.coins

function plugins (settings, deviceId) {
  function buildRates (tickers) {
    const config = configManager.machineScoped(deviceId, settings.config)
    const cryptoCodes = config.cryptoCurrencies

    const rates = {}

    cryptoCodes.forEach((cryptoCode, i) => {
      const cryptoConfig = configManager.scoped(cryptoCode, deviceId, settings.config)
      const rateRec = tickers[i]

      const cashInCommission = BN(1).add(BN(cryptoConfig.cashInCommission).div(100))

      const cashOutCommission = _.isNil(cryptoConfig.cashOutCommission)
      ? undefined
      : BN(1).add(BN(cryptoConfig.cashOutCommission).div(100))

      if (Date.now() - rateRec.timestamp > STALE_TICKER) return logger.warn('Stale rate for ' + cryptoCode)
      const rate = rateRec.rates
      rates[cryptoCode] = {
        cashIn: rate.ask.mul(cashInCommission),
        cashOut: cashOutCommission && rate.bid.div(cashOutCommission)
      }
    })

    return rates
  }

  function notificationsEnabled () {
    const config = configManager.unscoped(settings.config)
    return config.notificationsEnabled
  }

  function buildBalances (balanceRecs) {
    const config = configManager.machineScoped(deviceId, settings.config)
    const cryptoCodes = config.cryptoCurrencies

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
    const config = configManager.scoped(tx.cryptoCode, deviceId, settings.config)
    const zeroConfLimit = config.zeroConfLimit
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
    const config = configManager.machineScoped(deviceId, settings.config)

    if (!config.cashOutEnabled) return Promise.resolve()

    const denominations = [ config.topCashOutDenomination,
      config.bottomCashOutDenomination ]
    const virtualCassettes = [config.virtualCashOutDenomination]

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
        return {cassettes, virtualCassettes}
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
    const coin = coinParams[0]
    const cryptoNetwork = coinParams[1]
    const config = configManager.scoped(coin, deviceId, settings.config)
    const minimumTx = BN(config.minimumTx)
    const cashInFee = BN(config.cashInFee)

    return {
      cryptoCode: coin,
      display: coinUtils.display(coin),
      minimumTx: BN.max(minimumTx, cashInFee),
      cashInFee: cashInFee,
      cryptoNetwork
    }
  }

  function pollQueries (serialNumber, deviceTime, deviceRec) {
    const config = configManager.machineScoped(deviceId, settings.config)
    const fiatCode = config.fiatCurrency
    const cryptoCodes = config.cryptoCurrencies

    const tickerPromises = cryptoCodes.map(c => ticker.getRates(settings, fiatCode, c))
    const balancePromises = cryptoCodes.map(c => fiatBalance(fiatCode, c))
    const testnetPromises = cryptoCodes.map(c => wallet.cryptoNetwork(settings, c))
    const pingPromise = recordPing(serialNumber, deviceTime, deviceRec)
    const currentConfigVersionPromise = fetchCurrentConfigVersion()

    const promises = [
      buildAvailableCassettes(),
      pingPromise,
      currentConfigVersionPromise
    ].concat(tickerPromises, balancePromises, testnetPromises)

    return Promise.all(promises)
    .then(arr => {
      const cassettes = arr[0]
      const configVersion = arr[2]
      const cryptoCodesCount = cryptoCodes.length
      const tickers = arr.slice(3, cryptoCodesCount + 3)
      const balances = arr.slice(cryptoCodesCount + 3, 2 * cryptoCodesCount + 3)
      const testNets = arr.slice(2 * cryptoCodesCount + 3)
      const coinParams = _.zip(cryptoCodes, testNets)

      console.log('DEBUG200: %j', cryptoCodes)
      console.log('DEBUG201: %j', coinParams)
      return {
        cassettes,
        rates: buildRates(tickers),
        balances: buildBalances(balances),
        coins: _.map(mapCoinSettings, coinParams),
        configVersion
      }
    })
  }

  function sendCoins (tx) {
    return wallet.sendCoins(settings, tx.toAddress, tx.cryptoAtoms, tx.cryptoCode)
  }

  function recordPing (serialNumber, deviceTime, rec) {
    const r = {
      id: uuid.v4(),
      device_id: deviceId,
      serial_number: serialNumber,
      device_time: deviceTime
    }

    return db.none(pgp.helpers.insert(r, null, 'machine_pings'))
  }

  function isHd (tx) {
    return wallet.isHd(settings, tx.cryptoCode)
  }

  function getStatus (tx) {
    return wallet.getStatus(settings, tx, deviceId)
  }

  function newAddress (tx) {
    const info = {
      cryptoCode: tx.cryptoCode,
      label: 'TX ' + Date.now(),
      account: 'deposit',
      hdIndex: tx.hdIndex
    }
    return wallet.newAddress(settings, info)
  }

  function dispenseAck (tx) {
    const config = configManager.machineScoped(deviceId, settings.config)
    const cassettes = [ config.topCashOutDenomination,
      config.bottomCashOutDenomination ]

    return dbm.addDispense(deviceId, tx, cassettes)
  }

  function fiatBalance (fiatCode, cryptoCode) {
    const config = configManager.scoped(cryptoCode, deviceId, settings.config)
    return Promise.all([
      ticker.getRates(settings, fiatCode, cryptoCode),
      wallet.balance(settings, cryptoCode)
    ])
    .then(([rates, balanceRec]) => {
      const rawRate = rates.rates.ask
      const cashInCommission = BN(1).minus(BN(config.cashInCommission).div(100))
      const balance = balanceRec.balance

      if (!rawRate || !balance) return null

      const rate = rawRate.div(cashInCommission)

      const lowBalanceMargin = BN(1)

      const unitScale = BN(10).pow(coins[cryptoCode].unitScale)
      const fiatTransferBalance = balance.mul(rate.div(unitScale)).div(lowBalanceMargin)

      return {timestamp: balanceRec.timestamp, balance: fiatTransferBalance.truncated().toString()}
    })
  }

  function notifyConfirmation (tx) {
    logger.debug('notifyConfirmation')

    const phone = tx.phone
    const rec = {
      sms: {
        toNumber: phone,
        body: 'Your cash is waiting! Go to the Cryptomat and press Redeem within 24 hours.'
      }
    }

    return sms.sendMessage(settings, rec)
    .then(() => {
      const sql = 'update cash_out_txs set notified=$1 where id=$2'
      const values = [true, tx.id]

      return db.none(sql, values)
    })
  }

  function pong () {
    db.none('insert into server_events (event_type) values ($1)', ['ping'])
    .catch(logger.error)
  }

  function pongClear () {
    const sql = `delete from server_events
    where event_type=$1
    and created < now() - interval $2`

    db.none(sql, ['ping', PONG_TTL])
    .catch(logger.error)
  }

  /*
  * Trader functions
  */

  function buy (rec) {
    return buyAndSell(rec, true)
  }

  function sell (rec) {
    return buyAndSell(rec, false)
  }

  function buyAndSell (rec, doBuy) {
    const cryptoCode = rec.cryptoCode
    const fiatCode = rec.fiatCode
    const cryptoAtoms = doBuy ? rec.cryptoAtoms : rec.cryptoAtoms.neg()

    const market = [fiatCode, cryptoCode].join('')

    console.log('DEBUG505')
    if (!exchange.active(settings, cryptoCode)) return

    logger.debug('[%s] Pushing trade: %d', market, cryptoAtoms)
    if (!tradesQueues[market]) tradesQueues[market] = []
    tradesQueues[market].push({
      fiatCode,
      cryptoAtoms,
      cryptoCode,
      timestamp: Date.now()
    })
  }

  function consolidateTrades (cryptoCode, fiatCode) {
    const market = [fiatCode, cryptoCode].join('')

    const marketTradesQueues = tradesQueues[market]
    console.log('DEBUG504: %j', marketTradesQueues)
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

    const cryptoAtoms = filtered
    .reduce((prev, current) => prev.plus(current.cryptoAtoms), BN(0))

    const timestamp = filtered.map(r => r.timestamp).reduce((acc, r) => Math.max(acc, r), 0)

    const consolidatedTrade = {
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
    console.log('DEBUG500')
    return machineLoader.getMachines()
    .then(devices => {
      const deviceIds = devices.map(device => device.deviceId)
      const lists = deviceIds.map(deviceId => {
        const config = configManager.machineScoped(deviceId, settings.config)
        const fiatCode = config.fiatCurrency
        const cryptoCodes = config.cryptoCurrencies

        return cryptoCodes.map(cryptoCode => ({fiatCode, cryptoCode}))
      })

      const tradesPromises = _.uniq(_.flatten(lists))
      .map(r => executeTradesForMarket(settings, r.fiatCode, r.cryptoCode))

      return Promise.all(tradesPromises)
    })
    .catch(logger.error)
  }

  function executeTradesForMarket (settings, fiatCode, cryptoCode) {
    console.log('DEBUG501: %s, %j', cryptoCode, exchange.active(settings, cryptoCode))
    if (!exchange.active(settings, cryptoCode)) return

    const market = [fiatCode, cryptoCode].join('')
    const tradeEntry = consolidateTrades(cryptoCode, fiatCode)

    if (tradeEntry === null || tradeEntry.cryptoAtoms.eq(0)) return

    console.log('DEBUG502')

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

    console.log('DEBUG503')

    return execute(settings, tradeEntry.cryptoAtoms, tradeEntry.fiatCode, tradeEntry.cryptoCode)
    .then(() => recordTrade(tradeEntry))
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

  function recordTrade (_tradeEntry) {
    const massage = _.flow(
      _.pick(['cryptoCode', 'cryptoAtoms', 'fiatCode', 'type']),
      convertBigNumFields,
      _.mapKeys(_.snakeCase)
    )

    const tradeEntry = massage(_tradeEntry)
    const sql = pgp.helpers.insert(tradeEntry, null, 'trades')
    return db.none(sql)
  }

  function sendMessage (rec) {
    const config = configManager.unscoped(settings.config)

    let promises = []
    if (config.notificationsEmailEnabled) promises.push(email.sendMessage(settings, rec))
    if (config.notificationsSMSEnabled) promises.push(sms.sendMessage(settings, rec))

    return Promise.all(promises)
  }

  function checkDevicesCashBalances (fiatCode, devices) {
    return _.map(device => checkDeviceCashBalances(fiatCode, device), devices)
  }

  function checkDeviceCashBalances (fiatCode, device) {
    const config = configManager.machineScoped(device.deviceId, settings.config)
    const denomination1 = config.topCashOutDenomination
    const denomination2 = config.bottomCashOutDenomination
    const machineName = config.machineName

    const cashInAlert = device.cashbox > config.cashInAlertThreshold
    ? {code: 'CASH_BOX_FULL', machineName, deviceId: device.deviceId, notes: device.cashbox}
    : null

    const cassette1Alert = device.cassette1 < config.cashOutCassette1AlertThreshold
    ? {code: 'LOW_CASH_OUT', cassette: 1, machineName, deviceId: device.deviceId,
      notes: device.cassette1, denomination: denomination1, fiatCode}
    : null

    const cassette2Alert = device.cassette2 < config.cashOutCassette2AlertThreshold
    ? {code: 'LOW_CASH_OUT', cassette: 2, machineName, deviceId: device.deviceId,
      notes: device.cassette2, denomination: denomination2, fiatCode}
    : null

    return _.compact([cashInAlert, cassette1Alert, cassette2Alert])
  }

  function checkCryptoBalances (fiatCode, devices) {
    const fiatBalancePromises = cryptoCodes => _.map(c => fiatBalance(fiatCode, c), cryptoCodes)

    const fetchCryptoCodes = _deviceId => {
      const config = configManager.machineScoped(_deviceId, settings.config)
      return config.cryptoCurrencies
    }

    const union = _.flow(_.map(fetchCryptoCodes), _.flatten, _.uniq)
    const cryptoCodes = union(devices)
    const checkCryptoBalanceWithFiat = _.partial(checkCryptoBalance, [fiatCode])

    return Promise.all(fiatBalancePromises(cryptoCodes))
    .then(balances => _.map(checkCryptoBalanceWithFiat, _.zip(cryptoCodes, balances)))
  }

  function checkCryptoBalance (fiatCode, rec) {
    const [cryptoCode, fiatBalance] = rec
    const config = configManager.cryptoScoped(cryptoCode, settings.config)
    const cryptoAlertThreshold = config.cryptoAlertThreshold

    return BN(fiatBalance.balance).lt(cryptoAlertThreshold)
    ? {code: 'LOW_CRYPTO_BALANCE', cryptoCode, fiatBalance, fiatCode}
    : null
  }

  function checkBalances () {
    const globalConfig = configManager.unscoped(settings.config)
    const fiatCode = globalConfig.fiatCurrency

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

  return {
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
    pongClear,
    notifyConfirmation,
    sweepHd,
    sendMessage,
    checkBalances,
    getMachineNames,
    buildAvailableCassettes,
    buy,
    sell,
    notificationsEnabled
  }
}

module.exports = plugins
