const uuid = require('uuid')
const R = require('ramda')
const BigNumber = require('bignumber.js')
const argv = require('minimist')(process.argv.slice(2))
const crypto = require('crypto')

const dbm = require('./postgresql_interface')
const db = require('./db')
const logger = require('./logger')
const notifier = require('./notifier')
const T = require('./time')
const configManager = require('./config-manager')
const settingsLoader = require('./settings-loader')
const ticker = require('./ticker')
const wallet = require('./wallet')
const exchange = require('./exchange')
const sms = require('./sms')
const email = require('./email')

const CHECK_NOTIFICATION_INTERVAL = 30 * T.seconds
const ALERT_SEND_INTERVAL = T.hour
const INCOMING_TX_INTERVAL = 30 * T.seconds
const LIVE_INCOMING_TX_INTERVAL = 5 * T.seconds
const STALE_INCOMING_TX_AGE = T.week
const STALE_LIVE_INCOMING_TX_AGE = 10 * T.minutes
const UNNOTIFIED_INTERVAL = 10 * T.seconds
const MAX_NOTIFY_AGE = 2 * T.days
const MIN_NOTIFY_AGE = 5 * T.minutes
const TRANSACTION_EXPIRATION = 2 * T.days
const SWEEP_LIVE_HD_INTERVAL = T.minute
const SWEEP_OLD_HD_INTERVAL = 2 * T.minutes
const TRADE_INTERVAL = 10 * T.seconds
const TRADE_TTL = 2 * T.minutes
const STALE_TICKER = 3 * T.minutes
const STALE_BALANCE = 3 * T.minutes
const PONG_INTERVAL = 10 * T.seconds
const PONG_CLEAR_INTERVAL = 1 * T.day
const PONG_TTL = '1 week'
const tradesQueues = {}

const coins = {
  BTC: {unitScale: 8},
  ETH: {unitScale: 18}
}

let alertFingerprint = null
let lastAlertTime = null

function buildRates (deviceId, tickers) {
  const settings = settingsLoader.settings()
  const config = configManager.machineScoped(deviceId, settings.config)
  const cryptoCodes = config.cryptoCurrencies

  const cashInCommission = new BigNumber(config.cashInCommission).div(100).plus(1)
  const cashOutCommission = new BigNumber(config.cashOutCommission).div(100).plus(1)

  const rates = {}

  cryptoCodes.forEach((cryptoCode, i) => {
    const rateRec = tickers[i]
    if (Date.now() - rateRec.timestamp > STALE_TICKER) return logger.warn('Stale rate for ' + cryptoCode)
    const rate = rateRec.rates
    rates[cryptoCode] = {
      cashIn: rate.ask.times(cashInCommission),
      cashOut: rate.bid.div(cashOutCommission)
    }
  })

  return rates
}

function buildBalances (deviceId, balanceRecs) {
  const settings = settingsLoader.settings()
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

function pollQueries (deviceTime, deviceId, deviceRec) {
  const settings = settingsLoader.settings()
  const config = configManager.machineScoped(deviceId, settings.config)
  const fiatCode = config.fiatCurrency
  const cryptoCodes = config.cryptoCurrencies
  const cartridges = [ config.topCashOutDenomination,
    config.bottomCashOutDenomination ]
  const virtualCartridges = [config.virtualCashOutDenomination]

  const tickerPromises = cryptoCodes.map(c => ticker.getRates(fiatCode, c))
  const balancePromises = cryptoCodes.map(wallet.balance)
  const pingPromise = recordPing(deviceId, deviceTime, deviceRec)

  const promises = [dbm.cartridgeCounts(deviceId), pingPromise].concat(tickerPromises, balancePromises)

  return Promise.all(promises)
  .then(arr => {
    const cartridgeCounts = arr[0]
    const tickers = arr.slice(2, cryptoCodes.length + 2)
    const balances = arr.slice(cryptoCodes.length + 2)

    return {
      cartridges: buildCartridges(cartridges, virtualCartridges, cartridgeCounts),
      rates: buildRates(deviceId, tickers),
      balances: buildBalances(deviceId, balances)
    }
  })
}

// NOTE: This will fail if we have already sent coins because there will be
// a dbm unique dbm record in the table already.
function executeTx (deviceId, tx) {
  return dbm.addOutgoingTx(deviceId, tx)
  .then(() => wallet.sendCoins(tx.toAddress, tx.cryptoAtoms, tx.cryptoCode))
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

function stateChange (deviceId, deviceTime, rec) {
  const event = {
    id: rec.uuid,
    deviceId: deviceId,
    eventType: 'stateChange',
    note: JSON.stringify({state: rec.state, isIdle: rec.isIdle, txId: rec.txId}),
    deviceTime: deviceTime
  }
  return dbm.machineEvent(event)
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

    return wallet.newAddress(cryptoCode, info)
    .then(address => {
      const newTx = R.assoc('toAddress', address, tx)

      return dbm.addInitialIncoming(deviceId, newTx, address)
      .then(() => address)
    })
  })
}

function dispenseAck (deviceId, tx) {
  const settings = settingsLoader.settings()
  const config = configManager.machineScoped(deviceId, settings.config)
  const cartridges = [ config.topCashOutDenomination,
    config.bottomCashOutDenomination ]

  return dbm.addDispense(deviceId, tx, cartridges)
}

function fiatBalance (fiatCode, cryptoCode, deviceId) {
  const settings = settingsLoader.settings()
  const config = configManager.scoped(cryptoCode, deviceId, settings.config)

  return Promise.all([ticker.getRates(fiatCode, cryptoCode), wallet.balance(cryptoCode)])
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
  return wallet.getStatus(tx.toAddress, tx.cryptoAtoms, tx.cryptoCode)
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

  return sms.sendMessage(rec)
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
 * Polling livecycle
 */
function startPolling () {
  executeTrades()
  pong()
  pongClear()

  setInterval(executeTrades, TRADE_INTERVAL)
  setInterval(monitorLiveIncoming, LIVE_INCOMING_TX_INTERVAL)
  setInterval(monitorIncoming, INCOMING_TX_INTERVAL)
  setInterval(monitorUnnotified, UNNOTIFIED_INTERVAL)
  setInterval(sweepLiveHD, SWEEP_LIVE_HD_INTERVAL)
  setInterval(sweepOldHD, SWEEP_OLD_HD_INTERVAL)
  setInterval(pong, PONG_INTERVAL)
  setInterval(pongClear, PONG_CLEAR_INTERVAL)
  monitorLiveIncoming()
  monitorIncoming()
  monitorUnnotified()
  sweepLiveHD()
  sweepOldHD()
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
  .filter(trade => {
    console.log('DEBUG33: %j, %s, %s, %s', trade, t1, trade.timestamp, TRADE_TTL)
    return t1 - trade.timestamp < TRADE_TTL
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
  const settings = settingsLoader.settings()

  return dbm.devices()
  .then(devices => {
    const deviceIds = devices.map(device => device.device_id)
    const lists = deviceIds.map(deviceId => {
      const config = configManager.machineScoped(deviceId, settings.config)
      const fiatCode = config.fiatCurrency
      const cryptoCodes = config.cryptoCurrencies
      return cryptoCodes.map(cryptoCode => ({fiatCode, cryptoCode}))
    })

    const tradesPromises = R.uniq(R.flatten(lists))
    .map(r => executeTradesForMarket(settings, r.fiatCode, r.cryptoCode))

    return Promise.all(tradesPromises)
  })
  .catch(logger.error)
}

function executeTradesForMarket (settings, fiatCode, cryptoCode) {
  const market = [fiatCode, cryptoCode].join('')
  logger.debug('[%s] checking for trades', market)

  const trade = consolidateTrades(cryptoCode, fiatCode)
  if (trade === null) return logger.debug('[%s] no trades', market)

  if (trade.cryptoAtoms.eq(0)) {
    logger.debug('[%s] rejecting 0 trade', market)
    return
  }

  logger.debug('[%s] making a trade: %d', market, trade.cryptoAtoms.toString())

  return exchange.buy(trade.cryptoAtoms, trade.fiatCode, trade.cryptoCode)
  .then(() => logger.debug('[%s] Successful trade.', market))
  .catch(err => {
    tradesQueues[market].push(trade)
    if (err.name === 'NoExchangeError') return logger.debug(err.message)
    logger.error(err)
  })
}

function sendMessage (rec) {
  const settings = settingsLoader.settings()
  const config = configManager.unscoped(settings.config)

  let promises = []
  if (config.notificationsEmailEnabled) promises.push(email.sendMessage(rec))
  if (config.notificationsSMSEnabled) promises.push(sms.sendMessage(rec))

  return Promise.all(promises)
}

function sendNoAlerts () {
  const subject = '[Lamassu] All clear'
  const rec = {
    sms: {
      body: subject
    },
    email: {
      subject,
      body: 'No errors are reported for your machines.'
    }
  }
  return sendMessage(rec)
}

function checkNotification () {
  return notifier.checkStatus()
  .then(alertRec => {
    const currentAlertFingerprint = notifier.alertFingerprint(alertRec)
    if (!currentAlertFingerprint) {
      const inAlert = !!alertFingerprint
      alertFingerprint = null
      lastAlertTime = null
      if (inAlert) return sendNoAlerts()
    }

    const alertChanged = currentAlertFingerprint === alertFingerprint &&
      lastAlertTime - Date.now() < ALERT_SEND_INTERVAL
    if (alertChanged) return

    const subject = notifier.alertSubject(alertRec)
    const rec = {
      sms: {
        body: subject
      },
      email: {
        subject,
        body: notifier.printEmailAlerts(alertRec)
      }
    }
    alertFingerprint = currentAlertFingerprint
    lastAlertTime = Date.now()

    return sendMessage(rec)
  })
  .then(results => {
    if (results && results.length > 0) logger.debug('Successfully sent alerts')
  })
  .catch(err => {
    logger.error(err)
  })
}

function checkDeviceBalances (deviceId) {
  const settings = settingsLoader.settings()
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

function checkBalances () {
  return dbm.devices()
  .then(devices => {
    const deviceIds = devices.map(r => r.device_id)
    const deviceBalancePromises = deviceIds.map(deviceId => checkDeviceBalances(deviceId))

    return Promise.all(deviceBalancePromises)
    .then(arr => {
      const toMarket = r => r.fiatBalance + r.cryptoCode
      const min = R.minBy(r => r.fiatBalance)
      return R.values(R.reduceBy(min, Infinity, toMarket, R.flatten(arr)))
    })
  })
}

function startCheckingNotification (config) {
  notifier.init(checkBalances)
  checkNotification()
  setInterval(checkNotification, CHECK_NOTIFICATION_INTERVAL)
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

  return sms.sendMessage(rec)
  .then(() => code)
}

function fetchPhoneTx (phone) {
  return dbm.fetchPhoneTxs(phone, TRANSACTION_EXPIRATION)
  .then(txs => {
    const confirmedTxs = txs.filter(tx => R.contains(tx.status, ['instant', 'confirmed']))
    if (confirmedTxs.length > 0) {
      const maxTx = R.reduce((acc, val) => {
        return !acc || val.cryptoAtoms.gt(acc.cryptoAtoms) ? val : acc
      }, null, confirmedTxs)

      return {tx: maxTx}
    }

    if (txs.length > 0) return {pending: true}
    return {}
  })
}

function sweepHD (row) {
  const cryptoCode = row.crypto_code

  return wallet.sweep(row.hd_serial)
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

module.exports = {
  pollQueries,
  trade,
  stateChange,
  sendCoins,
  cashOut,
  dispenseAck,
  startPolling,
  startCheckingNotification,
  getPhoneCode,
  fetchPhoneTx
}
