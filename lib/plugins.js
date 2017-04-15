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

const mapValuesWithKey = _.mapValues.convert({cap: false})

const TRADE_TTL = 2 * T.minutes
const STALE_TICKER = 3 * T.minutes
const STALE_BALANCE = 3 * T.minutes
const PONG_TTL = '1 week'
const tradesQueues = {}

const coins = {
  BTC: {unitScale: 8},
  ETH: {unitScale: 18}
}

function plugins (settings, deviceId) {
  function buildRates (tickers) {
    const config = configManager.machineScoped(deviceId, settings.config)
    const cryptoCodes = config.cryptoCurrencies

    const rates = {}

    cryptoCodes.forEach((cryptoCode, i) => {
      const cryptoConfig = configManager.scoped(cryptoCode, deviceId, settings.config)
      const rateRec = tickers[i]

      const cashInCommission = BN(1).add(BN(cryptoConfig.cashInCommission).div(100))
      const cashOutCommission = cryptoConfig.cashOutCommission && BN(1).add(BN(cryptoConfig.cashOutCommission).div(100))

      if (Date.now() - rateRec.timestamp > STALE_TICKER) return logger.warn('Stale rate for ' + cryptoCode)
      const rate = rateRec.rates
      rates[cryptoCode] = {
        cashIn: rate.ask.mul(cashInCommission),
        cashOut: cryptoConfig.cashOutCommission && rate.bid.div(cashOutCommission)
      }
    })

    return rates
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

  function buildCartridges () {
    const config = configManager.machineScoped(deviceId, settings.config)

    if (!config.cashOutEnabled) return Promise.resolve()

    const cartridges = [ config.topCashOutDenomination,
      config.bottomCashOutDenomination ]
    const virtualCartridges = [config.virtualCashOutDenomination]

    return dbm.cartridgeCounts(deviceId)
    .then(rec => {
      if (argv.cassettes) {
        const counts = argv.cassettes.split(',')

        return {
          cartridges: [
            {
              denomination: parseInt(cartridges[0], 10),
              count: parseInt(counts[0], 10)
            },
            {
              denomination: parseInt(cartridges[1], 10),
              count: parseInt(counts[1], 10)
            }
          ],
          virtualCartridges
        }
      }

      return {
        cartridges: [
          {
            denomination: parseInt(cartridges[0], 10),
            count: parseInt(rec.counts[0], 10)
          },
          {
            denomination: parseInt(cartridges[1], 10),
            count: parseInt(rec.counts[1], 10)
          }
        ],
        virtualCartridges
      }
    })
  }

  function fetchCurrentConfigVersion () {
    const sql = `select id from user_config
    where type=$1
    order by id desc
    limit 1`

    return db.one(sql, ['config'])
    .then(row => row.id)
  }

  function pollQueries (deviceTime, deviceRec) {
    const config = configManager.machineScoped(deviceId, settings.config)
    const fiatCode = config.fiatCurrency
    const cryptoCodes = config.cryptoCurrencies

    const tickerPromises = cryptoCodes.map(c => ticker.getRates(settings, fiatCode, c))
    const balancePromises = cryptoCodes.map(c => fiatBalance(fiatCode, c))
    const pingPromise = recordPing(deviceTime, deviceRec)
    const currentConfigVersionPromise = fetchCurrentConfigVersion()

    const promises = [
      buildCartridges(),
      pingPromise,
      currentConfigVersionPromise
    ].concat(tickerPromises, balancePromises)

    return Promise.all(promises)
    .then(arr => {
      const cartridges = arr[0]
      const currentConfigVersion = arr[2]
      const tickers = arr.slice(3, cryptoCodes.length + 3)
      const balances = arr.slice(cryptoCodes.length + 3)

      return {
        cartridges,
        rates: buildRates(tickers),
        balances: buildBalances(balances),
        currentConfigVersion
      }
    })
  }

  function sendCoins (tx) {
    return wallet.sendCoins(settings, tx.toAddress, tx.cryptoAtoms, tx.cryptoCode)
  }

  function recordPing (deviceTime, rec) {
    const event = {
      id: uuid.v4(),
      deviceId,
      eventType: 'ping',
      note: JSON.stringify({state: rec.state, isIdle: rec.idle === 'true', txId: rec.txId}),
      deviceTime
    }
    return dbm.machineEvent(event)
  }

  function isHd (tx) {
    return wallet.isHd(settings, tx.cryptoCode)
  }

  function getStatus (tx) {
    return wallet.getStatus(settings, tx.toAddress, tx.cryptoAtoms, tx.cryptoCode)
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
    const cartridges = [ config.topCashOutDenomination,
      config.bottomCashOutDenomination ]

    return dbm.addDispense(deviceId, tx, cartridges)
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

      // `lowBalanceMargin` is our safety net. It's a number > 1, and we divide
      // all our balances by it to provide a safety margin.
      const lowBalanceMargin = (BN(config.lowBalanceMargin).div(100)).plus(1)

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

    console.log('DEBUG333')
    if (!exchange.active(settings, cryptoCode)) return
    console.log('DEBUG334')

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
    return dbm.devices()
    .then(devices => {
      const deviceIds = devices.map(device => device.device_id)
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

  function checkDeviceBalances (_deviceId) {
    const config = configManager.machineScoped(_deviceId, settings.config)
    const cryptoCodes = config.cryptoCurrencies
    const fiatCode = config.fiatCurrency
    const fiatBalancePromises = cryptoCodes.map(c => fiatBalance(fiatCode, c))

    return Promise.all(fiatBalancePromises)
    .then(arr => {
      return arr.map((balance, i) => ({
        fiatBalance: balance,
        cryptoCode: cryptoCodes[i],
        fiatCode,
        _deviceId
      }))
    })
  }

  function checkBalance (rec) {
    const config = configManager.unscoped(settings.config)
    const lowBalanceThreshold = config.lowBalanceThreshold

    return rec.fiatBalance.balance <= lowBalanceThreshold
    ? {code: 'lowBalance', cryptoCode: rec.cryptoCode, fiatBalance: rec.fiatBalance, fiatCode: rec.fiatCode}
    : null
  }

  function checkBalances () {
    return dbm.devices()
    .then(devices => {
      const deviceIds = devices.map(r => r.device_id)
      const deviceBalancePromises = deviceIds.map(deviceId => checkDeviceBalances(deviceId))

      return Promise.all(deviceBalancePromises)
      .then(arr => {
        const toMarket = r => [r.fiatCode, r.cryptoCode].join('')
        const min = _.minBy(r => r.fiatBalance)
        const byMarket = _.groupBy(toMarket, _.flatten(arr))
        const minByMarket = _.flatMap(min, byMarket)

        return _.reject(_.isNil, _.map(checkBalance, minByMarket))
      })
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

    console.log('DEBUG200')
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

  return {
    pollQueries,
    sendCoins,
    newAddress,
    isHd,
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
    buildCartridges,
    buy,
    sell
  }
}

module.exports = plugins
