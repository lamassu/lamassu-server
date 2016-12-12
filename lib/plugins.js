const uuid = require('uuid')
const _ = require('lodash/fp')
const BigNumber = require('bignumber.js')
const argv = require('minimist')(process.argv.slice(2))
const crypto = require('crypto')

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

const STALE_INCOMING_TX_AGE = T.week
const STALE_LIVE_INCOMING_TX_AGE = 10 * T.minutes
const MAX_NOTIFY_AGE = 2 * T.days
const MIN_NOTIFY_AGE = 5 * T.minutes
const TRADE_TTL = 2 * T.minutes
const STALE_TICKER = 3 * T.minutes
const STALE_BALANCE = 3 * T.minutes
const PONG_TTL = '1 week'
const tradesQueues = {}

const coins = {
  BTC: {unitScale: 8},
  ETH: {unitScale: 18}
}

function plugins (settings) {
  function buildRates (deviceId, tickers) {
    const config = configManager.machineScoped(deviceId, settings.config)
    const cryptoCodes = config.cryptoCurrencies
    const cashOut = config.cashOutEnabled

    const cashInCommission = new BigNumber(config.cashInCommission).div(100).plus(1)
    const cashOutCommission = cashOut && new BigNumber(config.cashOutCommission).div(100).plus(1)

    const rates = {}

    cryptoCodes.forEach((cryptoCode, i) => {
      const rateRec = tickers[i]
      if (Date.now() - rateRec.timestamp > STALE_TICKER) return logger.warn('Stale rate for ' + cryptoCode)
      const rate = rateRec.rates
      rates[cryptoCode] = {
        cashIn: rate.ask.times(cashInCommission),
        cashOut: cashOut ? rate.bid.div(cashOutCommission) : undefined
      }
    })

    return rates
  }

  function buildBalances (deviceId, balanceRecs) {
    const config = configManager.machineScoped(deviceId, settings.config)
    const cryptoCodes = config.cryptoCurrencies

    const balances = {}

    cryptoCodes.forEach((cryptoCode, i) => {
      const balanceRec = balanceRecs[i]
      if (!balanceRec) return logger.warn('No balance for ' + cryptoCode + ' yet')
      if (Date.now() - balanceRec.timestamp > STALE_BALANCE) return logger.warn('Stale balance for ' + cryptoCode)

      balances[cryptoCode] = balanceRec.balance
    })

    console.log('DEBUG66: %j', balances)
    return balances
  }

  function buildCartridges (cartridges, virtualCartridges, rec) {
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
  }

  function fetchCurrentConfigVersion () {
    const sql = `select id from user_config
    where type=$1
    order by id desc
    limit 1`

    return db.one(sql, ['config'])
    .then(row => row.id)
  }

  function pollQueries (deviceTime, deviceId, deviceRec) {
    const config = configManager.machineScoped(deviceId, settings.config)
    const fiatCode = config.fiatCurrency
    const cryptoCodes = config.cryptoCurrencies
    const cartridges = [ config.topCashOutDenomination,
      config.bottomCashOutDenomination ]
    const virtualCartridges = [config.virtualCashOutDenomination]

    const tickerPromises = cryptoCodes.map(c => ticker.getRates(settings, fiatCode, c))
    const balancePromises = cryptoCodes.map(c => fiatBalance(fiatCode, c, deviceId))
    const pingPromise = recordPing(deviceId, deviceTime, deviceRec)
    const currentConfigVersionPromise = fetchCurrentConfigVersion()

    const promises = [
      dbm.cartridgeCounts(deviceId),
      pingPromise,
      currentConfigVersionPromise
    ].concat(tickerPromises, balancePromises)

    return Promise.all(promises)
    .then(arr => {
      const cartridgeCounts = arr[0]
      const currentConfigVersion = arr[2]
      const tickers = arr.slice(3, cryptoCodes.length + 3)
      const balances = arr.slice(cryptoCodes.length + 3)

      return {
        cartridges: buildCartridges(cartridges, virtualCartridges, cartridgeCounts),
        rates: buildRates(deviceId, tickers),
        balances: buildBalances(deviceId, balances),
        currentConfigVersion
      }
    })
  }

  // NOTE: This will fail if we have already sent coins because there will be
  // a dbm unique dbm record in the table already.
  function executeTx (deviceId, tx) {
    return dbm.addOutgoingTx(deviceId, tx)
    .then(() => wallet.sendCoins(settings, tx.toAddress, tx.cryptoAtoms, tx.cryptoCode))
    .then(txHash => {
      const fee = null // Need to fill this out in plugins
      const toSend = {cryptoAtoms: tx.cryptoAtoms, fiat: tx.fiat}

      return dbm.sentCoins(tx, toSend, fee, null, txHash)
      .then(() => ({
        statusCode: 201, // Created
        txHash,
        txId: tx.id
      }))
    })
  }

  function trade (deviceId, rawTrade) {
    // TODO: move this to dbm, too
    // add bill to trader queue (if trader is enabled)
    const cryptoCode = rawTrade.cryptoCode
    const fiatCode = rawTrade.fiatCode
    const cryptoAtoms = rawTrade.cryptoAtoms

    return dbm.recordBill(deviceId, rawTrade)
    .then(() => {
      const market = [fiatCode, cryptoCode].join('')

      if (!exchange.active(settings, cryptoCode)) return

      logger.debug('[%s] Pushing trade: %d', market, cryptoAtoms)
      if (!tradesQueues[market]) tradesQueues[market] = []
      tradesQueues[market].push({
        fiatCode,
        cryptoAtoms,
        cryptoCode,
        timestamp: Date.now()
      })
    })
  }

  function recordPing (deviceId, deviceTime, rec) {
    const event = {
      id: uuid.v4(),
      deviceId: deviceId,
      eventType: 'ping',
      note: JSON.stringify({state: rec.state, isIdle: rec.idle === 'true', txId: rec.txId}),
      deviceTime: deviceTime
    }
    return dbm.machineEvent(event)
  }

  function sendCoins (deviceId, rawTx) {
    return executeTx(deviceId, rawTx)
  }

  function cashOut (deviceId, tx) {
    const cryptoCode = tx.cryptoCode

    const serialPromise = wallet.supportsHD
    ? dbm.nextCashOutSerialHD(tx.id, cryptoCode)
    : Promise.resolve()

    return serialPromise
    .then(serialNumber => {
      const info = {
        label: 'TX ' + Date.now(),
        account: 'deposit',
        serialNumber
      }

      return wallet.newAddress(settings, cryptoCode, info)
      .then(address => {
        const newTx = _.set('toAddress', address, tx)

        return dbm.addInitialIncoming(deviceId, newTx, address)
        .then(() => address)
      })
    })
  }

  function dispenseAck (deviceId, tx) {
    const config = configManager.machineScoped(deviceId, settings.config)
    const cartridges = [ config.topCashOutDenomination,
      config.bottomCashOutDenomination ]

    return dbm.addDispense(deviceId, tx, cartridges)
  }

  function fiatBalance (fiatCode, cryptoCode, deviceId) {
    const config = configManager.scoped(cryptoCode, deviceId, settings.config)

    return Promise.all([
      ticker.getRates(settings, fiatCode, cryptoCode),
      wallet.balance(settings, cryptoCode)
    ])
    .then(([rates, balanceRec]) => {
      const rawRate = rates.rates.ask
      const commission = (new BigNumber(config.cashInCommission).div(100)).plus(1)
      const balance = balanceRec.balance

      if (!rawRate || !balance) return null

      // The rate is actually our commission times real rate.
      const rate = rawRate.times(commission)

      // `lowBalanceMargin` is our safety net. It's a number > 1, and we divide
      // all our balances by it to provide a safety margin.
      const lowBalanceMargin = (new BigNumber(config.lowBalanceMargin).div(100)).plus(1)

      const unitScale = new BigNumber(10).pow(coins[cryptoCode].unitScale)
      const fiatTransferBalance = balance.div(unitScale).times(rate).div(lowBalanceMargin)

      return {timestamp: balanceRec.timestamp, balance: fiatTransferBalance.round(3).toNumber()}
    })
  }

  function processTxStatus (tx) {
    return wallet.getStatus(settings, tx.toAddress, tx.cryptoAtoms, tx.cryptoCode)
    .then(res => dbm.updateTxStatus(tx, res.status))
  }

  function notifyConfirmation (tx) {
    logger.debug('notifyConfirmation')

    const phone = tx.phone
    const rec = {
      sms: {
        toNumber: phone,
        body: 'Your cash is waiting! Go to the Cryptomat and press Redeem.'
      }
    }

    return sms.sendMessage(settings, rec)
    .then(() => dbm.updateNotify(tx))
  }

  function monitorLiveIncoming () {
    const statuses = ['notSeen', 'published', 'insufficientFunds']

    return dbm.fetchOpenTxs(statuses, STALE_LIVE_INCOMING_TX_AGE)
    .then(txs => Promise.all(txs.map(processTxStatus)))
    .catch(logger.error)
  }

  function monitorIncoming () {
    const statuses = ['notSeen', 'published', 'authorized', 'instant', 'rejected', 'insufficientFunds']

    return dbm.fetchOpenTxs(statuses, STALE_INCOMING_TX_AGE)
    .then(txs => Promise.all(txs.map(processTxStatus)))
    .catch(logger.error)
  }

  function monitorUnnotified () {
    dbm.fetchUnnotifiedTxs(MAX_NOTIFY_AGE, MIN_NOTIFY_AGE)
    .then(txs => Promise.all(txs.map(notifyConfirmation)))
    .catch(logger.error)
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
    .reduce((prev, current) => prev.plus(current.cryptoAtoms), new BigNumber(0))

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
    logger.debug('[%s] checking for trades', market)

    const tradeEntry = consolidateTrades(cryptoCode, fiatCode)
    if (tradeEntry === null) return logger.debug('[%s] no trades', market)

    if (tradeEntry.cryptoAtoms.eq(0)) {
      logger.debug('[%s] rejecting 0 trade', market)
      return
    }

    logger.debug('[%s] making a trade: %d', market, tradeEntry.cryptoAtoms.toString())

    return exchange.buy(settings, tradeEntry.cryptoAtoms, tradeEntry.fiatCode, tradeEntry.cryptoCode)
    .then(() => logger.debug('[%s] Successful trade.', market))
    .catch(err => {
      tradesQueues[market].push(tradeEntry)
      if (err.name === 'NoExchangeError') return logger.debug(err.message)
      logger.error(err)
    })
  }

  function sendMessage (rec) {
    const config = configManager.unscoped(settings.config)

    let promises = []
    if (config.notificationsEmailEnabled) promises.push(email.sendMessage(settings, rec))
    if (config.notificationsSMSEnabled) promises.push(sms.sendMessage(settings, rec))

    return Promise.all(promises)
  }

  function checkDeviceBalances (deviceId) {
    const config = configManager.machineScoped(deviceId, settings.config)
    const cryptoCodes = config.cryptoCurrencies
    const fiatCode = config.fiatCurrency
    const fiatBalancePromises = cryptoCodes.map(c => fiatBalance(fiatCode, c, deviceId))

    return Promise.all(fiatBalancePromises)
    .then(arr => {
      return arr.map((balance, i) => ({
        fiatBalance: balance,
        cryptoCode: cryptoCodes[i],
        fiatCode,
        deviceId
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
    return new BigNumber(crypto.randomBytes(3).toString('hex'), 16).shift(-6).toFixed(6).slice(-6)
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

  function sweepHD (row) {
    const cryptoCode = row.crypto_code

    return wallet.sweep(settings, row.hd_serial)
    .then(txHash => {
      if (txHash) {
        logger.debug('[%s] Swept address with tx: %s', cryptoCode, txHash)
        return dbm.markSwept(row.tx_id)
      }
    })
    .catch(err => logger.error('[%s] Sweep error: %s', cryptoCode, err.message))
  }

  function sweepLiveHD () {
    return dbm.fetchLiveHD()
    .then(rows => Promise.all(rows.map(sweepHD)))
    .catch(err => logger.error(err))
  }

  function sweepOldHD () {
    return dbm.fetchOldHD()
    .then(rows => Promise.all(rows.map(sweepHD)))
    .catch(err => logger.error(err))
  }

  return {
    pollQueries,
    trade,
    sendCoins,
    cashOut,
    dispenseAck,
    getPhoneCode,
    executeTrades,
    pong,
    pongClear,
    monitorLiveIncoming,
    monitorIncoming,
    monitorUnnotified,
    sweepLiveHD,
    sweepOldHD,
    sendMessage,
    checkBalances
  }
}

module.exports = plugins
