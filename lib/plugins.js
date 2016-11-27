'use strict'

const uuid = require('uuid')
const R = require('ramda')
const BigNumber = require('bignumber.js')

// Needed for BigNumber for now
global.crypto = require('crypto')
BigNumber.config({CRYPTO: true})

const db = require('./postgresql_interface')
const logger = require('./logger')
const notifier = require('./notifier')
const T = require('./time')
const settingsLoader = require('./settings')
const configManager = require('./config-manager')
const ticker = require('./ticker')
const wallet = require('./wallet')
const exchange = require('./exchange')
const sms = require('./sms')
const email = require('./email')

const tradeIntervals = {}

const CHECK_NOTIFICATION_INTERVAL = T.minute
const ALERT_SEND_INTERVAL = T.hour
const INCOMING_TX_INTERVAL = 30 * T.seconds
const LIVE_INCOMING_TX_INTERVAL = 5 * T.seconds
const STALE_INCOMING_TX_AGE = T.week
const STALE_LIVE_INCOMING_TX_AGE = 10 * T.minutes
const UNNOTIFIED_INTERVAL = T.minute
const MAX_NOTIFY_AGE = 2 * T.days
const MIN_NOTIFY_AGE = 5 * T.minutes
const TRANSACTION_EXPIRATION = 2 * T.days
const SWEEP_LIVE_HD_INTERVAL = T.minute
const SWEEP_OLD_HD_INTERVAL = 2 * T.minutes
const TRADE_INTERVAL = T.minute
const TRADE_TTL = 5 * T.minutes

const tradesQueues = {}

const coins = {
  BTC: {unitScale: 8},
  ETH: {unitScale: 18}
}

let alertFingerprint = null
let lastAlertTime = null

function getConfig (machineId) {
  const config = settingsLoader.settings().config
  return configManager.machineScoped(machineId, config)
}

exports.getConfig = getConfig
exports.logEvent = db.recordDeviceEvent

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

exports.pollQueries = function pollQueries (deviceId) {
  const config = getConfig(deviceId)
  const cartridges = [ config.currencies.topCashOutDenomination,
    config.currencies.bottomCashOutDenomination ]
  const virtualCartridges = [config.currencies.virtualCashOutDenomination]

  return db.cartridgeCounts(deviceId)
  .then(result => ({
    cartridges: buildCartridges(cartridges, virtualCartridges, result)
  }))
}

// NOTE: This will fail if we have already sent coins because there will be
// a db unique db record in the table already.
function executeTx (deviceId, tx) {
  return db.addOutgoingTx(deviceId, tx)
  .then(() => wallet.sendCoins(tx.toAddress, tx.cryptoAtoms, tx.cryptoCode))
  .then(txHash => {
    const fee = null // Need to fill this out in plugins
    const toSend = {cryptoAtoms: tx.cryptoAtoms, fiat: tx.fiat}

    return db.sentCoins(tx, toSend, fee, null, txHash)
    .then(() => ({
      statusCode: 201, // Created
      txHash,
      txId: tx.id
    }))
  })
}

// TODO: Run these in parallel and return success
exports.trade = function trade (deviceId, rawTrade) {
  // TODO: move this to DB, too
  // add bill to trader queue (if trader is enabled)
  const cryptoCode = rawTrade.cryptoCode

  return db.recordBill(deviceId, rawTrade)
  .then(() => exchange.active(cryptoCode))
  .then(active => {
    if (!active) return

    logger.debug('[%s] Pushing trade: %d', cryptoCode, rawTrade.cryptoAtoms)
    tradesQueues[cryptoCode].push({
      currency: rawTrade.currency,
      cryptoAtoms: rawTrade.cryptoAtoms,
      cryptoCode,
      timestamp: Date.now()
    })
  })
}

exports.stateChange = function stateChange (deviceId, deviceTime, rec, cb) {
  const event = {
    id: rec.uuid,
    deviceId: deviceId,
    eventType: 'stateChange',
    note: JSON.stringify({state: rec.state, isIdle: rec.isIdle, txId: rec.txId}),
    deviceTime: deviceTime
  }
  return db.machineEvent(event)
}

exports.recordPing = function recordPing (deviceId, deviceTime, rec, cb) {
  const event = {
    id: uuid.v4(),
    deviceId: deviceId,
    eventType: 'ping',
    note: JSON.stringify({state: rec.state, isIdle: rec.idle === 'true', txId: rec.txId}),
    deviceTime: deviceTime
  }
  return db.machineEvent(event)
}

exports.sendCoins = function sendCoins (deviceId, rawTx) {
  return executeTx(deviceId, rawTx)
}

exports.cashOut = function cashOut (deviceId, tx) {
  const cryptoCode = tx.cryptoCode

  const serialPromise = wallet.supportsHD
  ? db.nextCashOutSerialHD(tx.id, cryptoCode)
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

      return db.addInitialIncoming(deviceId, newTx, address)
      .then(() => address)
    })
  })
}

exports.dispenseAck = function (deviceId, tx) {
  const config = getConfig(deviceId)
  const cartridges = [ config.currencies.topCashOutDenomination,
    config.currencies.bottomCashOutDenomination ]

  return db.addDispense(deviceId, tx, cartridges)
}

exports.fiatBalance = function fiatBalance (fiatCode, cryptoCode, deviceId) {
  const _config = settingsLoader.settings().config
  const config = configManager.scoped(cryptoCode, deviceId, _config)

  return Promise.all([ticker.ticker(cryptoCode), wallet.balance(cryptoCode)])
  .then(([rates, balanceRec]) => {
    const rawRate = rates[cryptoCode].rates.ask
    const commission = (new BigNumber(config.commissions.cashInCommission).div(100)).plus(1)
    const balance = balanceRec.balance

    if (!rawRate || !balance) return null

    // The rate is actually our commission times real rate.
    const rate = rawRate.times(commission)

    // `lowBalanceMargin` is our safety net. It's a number > 1, and we divide
    // all our balances by it to provide a safety margin.
    const lowBalanceMargin = (new BigNumber(config.commissions.lowBalanceMargin).div(100)).plus(1)

    const unitScale = new BigNumber(10).pow(coins[cryptoCode].unitScale)
    const fiatTransferBalance = balance.div(unitScale).times(rate).div(lowBalanceMargin)

    return {timestamp: balanceRec.timestamp, balance: fiatTransferBalance.round(3).toNumber()}
  })
}

function processTxStatus (tx) {
  return wallet.getStatus(tx.toAddress, tx.cryptoAtoms, tx.cryptoCode)
  .then(res => db.updateTxStatus(tx, res.status))
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
  .then(() => db.updateNotify(tx))
}

function monitorLiveIncoming () {
  const statuses = ['notSeen', 'published', 'insufficientFunds']
  db.fetchOpenTxs(statuses, STALE_LIVE_INCOMING_TX_AGE)
  .then(txs => Promise.all(txs.map(processTxStatus)))
  .catch(err => logger.error(err))
}

function monitorIncoming () {
  const statuses = ['notSeen', 'published', 'authorized', 'instant', 'rejected', 'insufficientFunds']
  db.fetchOpenTxs(statuses, STALE_INCOMING_TX_AGE)
  .then(txs => Promise.all(txs.map(processTxStatus)))
  .catch(err => logger.error(err))
}

function monitorUnnotified () {
  db.fetchUnnotifiedTxs(MAX_NOTIFY_AGE, MIN_NOTIFY_AGE)
  .then(txs => Promise.all(txs.map(notifyConfirmation)))
  .catch(err => logger.error(err))
}

/*
 * Polling livecycle
 */
exports.startPolling = function startPolling () {
  executeTrades()

  const cryptoCodes = getAllCryptoCodes()
  cryptoCodes.forEach(cryptoCode => {
    startTrader(cryptoCode)
  })

  setInterval(monitorLiveIncoming, LIVE_INCOMING_TX_INTERVAL)
  setInterval(monitorIncoming, INCOMING_TX_INTERVAL)
  setInterval(monitorUnnotified, UNNOTIFIED_INTERVAL)
  setInterval(sweepLiveHD, SWEEP_LIVE_HD_INTERVAL)
  setInterval(sweepOldHD, SWEEP_OLD_HD_INTERVAL)

  monitorLiveIncoming()
  monitorIncoming()
  monitorUnnotified()
  sweepLiveHD()
  sweepOldHD()
}

function startTrader (cryptoCode) {
  if (tradeIntervals[cryptoCode]) return

  logger.debug('[%s] startTrader', cryptoCode)

  tradeIntervals[cryptoCode] = setInterval(() => executeTrades(cryptoCode), TRADE_INTERVAL)
}

/*
 * Trader functions
 */
function buy (trade) {
  return exchange.buy(trade.cryptoAtoms, trade.fiatCode, trade.cryptoCode)
}

function consolidateTrades (cryptoCode, fiatCode) {
  const market = [fiatCode, cryptoCode].join('')

  if (tradesQueues[market].length === 0) return null

  logger.debug('[%s] tradesQueues size: %d', market, tradesQueues[market].length)
  logger.debug('[%s] tradesQueues head: %j', market, tradesQueues[market][0])

  const t0 = Date.now()

  const filtered = tradesQueues[market]
  .filter(trade => t0 - trade.timestamp < TRADE_TTL)

  const filteredCount = tradesQueues[market].length - filtered.length

  if (filteredCount > 0) {
    tradesQueues[market] = filtered
    logger.debug('[%s] expired %d trades', market, filteredCount)
  }

  const cryptoAtoms = filtered
  .reduce((prev, current) => prev.plus(current.cryptoAtoms), new BigNumber(0))

  const consolidatedTrade = {
    fiatCode,
    cryptoAtoms,
    cryptoCode
  }

  tradesQueues[market] = []

  logger.debug('[%s] consolidated: %j', market, consolidatedTrade)
  return consolidatedTrade
}

function executeTrades (cryptoCode, fiatCode) {
  const market = [fiatCode, cryptoCode].join('')
  logger.debug('[%s] checking for trades', market)

  const trade = consolidateTrades(cryptoCode, fiatCode)
  if (trade === null) return logger.debug('[%s] no trades', market)

  if (trade.cryptoAtoms.eq(0)) {
    logger.debug('[%s] rejecting 0 trade', market)
    return
  }

  logger.debug('[%s] making a trade: %d', market, trade.cryptoAtoms.toString())
  return buy(trade)
  .catch(err => {
    tradesQueues[market].push(trade)
    logger.error(err)
  })
  .then(() => {
    logger.debug('[%s] Successful trade.', market)
  })
}

function sendMessage (rec) {
  return Promise.all([sms.sendMessage(rec), email.sendMessage(rec)])
}
exports.sendMessage = sendMessage

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

function getCryptoCodes (deviceId) {
  return settingsLoader.settings()
  .then(settings => {
    return configManager.machineScoped(deviceId, settings.config).currencies.cryptoCurrencies
  })
}
exports.getCryptoCodes = getCryptoCodes

// Get union of all cryptoCodes from all machines
function getAllCryptoCodes () {
  return Promise.all([db.devices(), settingsLoader.settings()])
  .then(([rows, settings]) => {
    return rows.reduce((acc, r) => {
      const cryptoCodes = configManager.machineScoped(r.device_id, settings.config).currencies.cryptoCurrencies
      cryptoCodes.forEach(c => acc.add(c))
      return acc
    }, new Set())
  })
}

function getAllMarkets () {
  return Promise.all([db.devices(), settingsLoader.settings()])
  .then(([rows, settings]) => {
    return rows.reduce((acc, r) => {
      const currencies = configManager.machineScoped(r.device_id, settings.config).currencies
      const cryptoCodes = currencies.cryptoCurrencies
      const fiatCodes = currencies.fiatCodes
      fiatCodes.forEach(fiatCode => cryptoCodes.forEach(cryptoCode => acc.add(fiatCode + cryptoCode)))
      return acc
    }, new Set())
  })
}

function checkBalances () {
  return Promise.all([getAllMarkets(), db.devices()])
  .then(([markets, devices]) => {
    const deviceIds = devices.map(r => r.device_id)
    const balances = []

    markets.forEach(market => {
      const fiatCode = market.fiatCode
      const cryptoCode = market.cryptoCode
      const minBalance = deviceIds.map(deviceId => {
        const fiatBalanceRec = exports.fiatBalance(fiatCode, cryptoCode, deviceId)
        return fiatBalanceRec ? fiatBalanceRec.balance : Infinity
      })
      .reduce((min, cur) => Math.min(min, cur), Infinity)

      const rec = {fiatBalance: minBalance, cryptoCode, fiatCode}
      balances.push(rec)
    })

    return balances
  })
}

exports.startCheckingNotification = function startCheckingNotification (config) {
  notifier.init(db, checkBalances, config.notifications)
  checkNotification()
  setInterval(checkNotification, CHECK_NOTIFICATION_INTERVAL)
}

exports.getPhoneCode = function getPhoneCode (phone) {
  return sms.name()
  .then(name => {
    const code = name === 'MockSMS'
    ? '123'
    : BigNumber.random().toFixed(6).slice(2)

    const rec = {
      sms: {
        toNumber: phone,
        body: 'Your cryptomat code: ' + code
      }
    }

    return sms.sendMessage(rec)
    .then(() => code)
  })
}

exports.updatePhone = db.addIncomingPhone
exports.registerRedeem = db.updateRedeem

exports.fetchPhoneTx = function fetchPhoneTx (phone) {
  return db.fetchPhoneTxs(phone, TRANSACTION_EXPIRATION)
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

exports.requestDispense = function requestDispense (tx) {
  return db.addDispenseRequest(tx)
}

exports.fetchTx = db.fetchTx

function sweepHD (row) {
  const cryptoCode = row.crypto_code

  return wallet.sweep(row.hd_serial)
  .then(txHash => {
    if (txHash) {
      logger.debug('[%s] Swept address with tx: %s', cryptoCode, txHash)
      return db.markSwept(row.tx_id)
    }
  })
  .catch(err => logger.error('[%s] Sweep error: %s', cryptoCode, err.message))
}

function sweepLiveHD () {
  return db.fetchLiveHD()
  .then(rows => Promise.all(rows.map(sweepHD)))
  .catch(err => logger.error(err))
}

function sweepOldHD () {
  return db.fetchOldHD()
  .then(rows => Promise.all(rows.map(sweepHD)))
  .catch(err => logger.error(err))
}
