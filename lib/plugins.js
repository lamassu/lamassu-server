'use strict'

const fs = require('fs')
const uuid = require('uuid')
const R = require('ramda')
const async = require('async')
const HKDF = require('node-hkdf-sync')
const BigNumber = require('bignumber.js')

// Needed for BigNumber for now
global.crypto = require('crypto')
BigNumber.config({CRYPTO: true})

const db = require('./postgresql_interface')
const logger = require('./logger')
const notifier = require('./notifier')
const T = require('./time')
const configManager = require('./config-manager')

const tradeIntervals = {}

const CHECK_NOTIFICATION_INTERVAL = T.minute
const ALERT_SEND_INTERVAL = T.hour
const POLLING_RATE = T.minute
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
const LOW_BALANCE_MARGIN_DEFAULT = 1.05

const tickerPlugins = {}
const traderPlugins = {}
const walletPlugins = {}
let idVerifierPlugin = null
let emailPlugin = null
let smsPlugin = null
let hkdf = null

const currentlyUsedPlugins = {}

let cachedConfig = null
let deviceCurrency = 'USD'

const lastBalances = {}
const lastRates = {}

const tradesQueues = {}

const coins = {
  BTC: {unitScale: 8},
  ETH: {unitScale: 18}
}

let alertFingerprint = null
let lastAlertTime = null

exports.init = function init (seedPath) {
  const masterSeed = new Buffer(fs.readFileSync(seedPath, 'utf8').trim(), 'hex')
  hkdf = new HKDF('sha256', 'lamassu-server-salt', masterSeed)
}

function loadPlugin (name, config) {
  // plugins definitions
  const moduleMethods = {
    ticker: ['ticker'],
    trader: ['purchase', 'sell'],
    wallet: ['balance', 'sendBitcoins', 'newAddress'],
    idVerifier: ['verifyUser', 'verifyTransaction'],
    info: ['checkAddress'],
    email: ['sendMessage']
  }

  let plugin = null

  // each used plugin MUST be installed
  try {
    plugin = require('lamassu-' + name)
  } catch (err) {
    logger.debug(err.stack)
    if (err.code === 'MODULE_NOT_FOUND') {
      throw new Error(name + ' module is not installed. ' +
          'Try running \'npm install --save lamassu-' + name + '\' first')
    }
    logger.error('Error in %s plugin', name)
    logger.error(err)
    throw err
  }

  // each plugin MUST implement those
  if (typeof plugin.SUPPORTED_MODULES !== 'undefined') {
    if (plugin.SUPPORTED_MODULES === 'string') {
      plugin.SUPPORTED_MODULES = [plugin.SUPPORTED_MODULES]
    }
  }

  if (!(plugin.SUPPORTED_MODULES instanceof Array)) {
    throw new Error('\'' + name + '\' fails to implement *required* ' +
      '\'SUPPORTED_MODULES\' constant')
  }

  plugin.SUPPORTED_MODULES.forEach(moduleName => {
    moduleMethods[moduleName].forEach(methodName => {
      if (typeof plugin[methodName] !== 'function') {
        throw new Error('\'' + name + '\' declares \'' + moduleName +
          '\', but fails to implement \'' + methodName + '\' method')
      }
    })
  })

  // each plugin SHOULD implement those
  if (typeof plugin.NAME === 'undefined') {
    logger.warn(new Error('\'' + name +
      '\' fails to implement *recommended* \'NAME\' field'))
  }

  if (typeof plugin.config !== 'function') {
    logger.warn(new Error('\'' + name +
      '\' fails to implement *recommended* \'config\' method'))
    plugin.config = () => {}
  } else if (config !== null) {
    plugin.config(config, logger) // only when plugin supports it, and config is passed
  }

  return plugin
}

function loadOrConfigPlugin (pluginHandle, pluginType, cryptoCode, config, accounts, options,
    onChangeCallback) {
  const currentName = config.cryptoServices[pluginType]

  currentlyUsedPlugins[cryptoCode] = currentlyUsedPlugins[cryptoCode] || {}

  const pluginChanged = currentlyUsedPlugins[cryptoCode][pluginType] !== currentName

  if (!currentName) pluginHandle = null
  else { // some plugins may be disabled
    const pluginConfig = accounts[currentName]

    const mergedConfig = R.merge(pluginConfig, options)

    if (pluginHandle && !pluginChanged) pluginHandle.config(mergedConfig)
    else {
      pluginHandle = loadPlugin(currentName, mergedConfig)
      currentlyUsedPlugins[cryptoCode] = currentlyUsedPlugins[cryptoCode] || {}
      currentlyUsedPlugins[cryptoCode][pluginType] = currentName
      const pluginName = pluginHandle.NAME || currentName

      cryptoCode
      ? logger.debug('[%s] plugin(%s) loaded: %s', cryptoCode, pluginType, pluginName)
      : logger.debug('plugin(%s) loaded: %s', pluginType, pluginName)
    }
  }

  if (typeof onChangeCallback === 'function') onChangeCallback(pluginHandle)

  return pluginHandle
}
exports.loadOrConfigPlugin = loadOrConfigPlugin

// Note: this whole function gets called every time there's a config update
exports.configure = function configure (config) {
  cachedConfig = config

  const cryptoCodes = getCryptoCodes()

  console.log('DEBUG30')

  return configManager.loadAccounts()
  .then(accounts => {
    cryptoCodes.forEach(cryptoCode => {
      console.log('DEBUG31')
      const cryptoScopedConfig = configManager.cryptoScoped(cryptoCode, cachedConfig)

      console.log('DEBUG31.1')

    // TICKER [required] configure (or load)
      loadOrConfigPlugin(
        tickerPlugins[cryptoCode],
        'ticker',
        cryptoCode,
        cryptoScopedConfig,
        accounts,
        {currency: deviceCurrency},
        function onTickerChange (newTicker) {
          tickerPlugins[cryptoCode] = newTicker
          pollRate(cryptoCode)
        }
      )

      console.log('DEBUG31.2')

      // Give each crypto a different derived seed so as not to allow any
      // plugin to spend another plugin's funds
      const cryptoSeed = hkdf.derive(cryptoCode, 32)

      loadOrConfigPlugin(
        walletPlugins[cryptoCode],
        'wallet',
        cryptoCode,
        cryptoScopedConfig,
        accounts,
        {masterSeed: cryptoSeed},
        function onWalletChange (newWallet) {
          walletPlugins[cryptoCode] = newWallet
          pollBalance(cryptoCode)
        }
      )

      tradesQueues[cryptoCode] = tradesQueues[cryptoCode] || []

      loadOrConfigPlugin(
        traderPlugins[cryptoCode],
        'trader',
        cryptoCode,
        cryptoScopedConfig,
        accounts,
        null,
        function onTraderChange (newTrader) {
          traderPlugins[cryptoCode] = newTrader
          if (newTrader === null) stopTrader(cryptoCode)
          else startTrader(cryptoCode)
        }
      )
    })

    const unscopedCfg = configManager.unscoped(cachedConfig)

    // ID VERIFIER [optional] configure (or load)
    idVerifierPlugin = loadOrConfigPlugin(
      idVerifierPlugin,
      'idVerifier',
      null,
      unscopedCfg,
      accounts
    )

    emailPlugin = loadOrConfigPlugin(
      emailPlugin,
      'email',
      null,
      unscopedCfg,
      accounts
    )

    smsPlugin = loadOrConfigPlugin(
      smsPlugin,
      'sms',
      null,
      unscopedCfg,
      accounts
    )
  })
}

function getConfig (machineId) {
  return configManager.machineScoped(machineId, cachedConfig)
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

function _sendCoins (toAddress, cryptoAtoms, cryptoCode) {
  return new Promise((resolve, reject) => {
    _sendCoinsCb(toAddress, cryptoAtoms, cryptoCode, (err, txHash) => {
      console.log('DEBUG12: %j, %j', err, txHash)
      if (err) return reject(err)
      return resolve(txHash)
    })
  })
}

function _sendCoinsCb (toAddress, cryptoAtoms, cryptoCode, cb) {
  const walletPlugin = walletPlugins[cryptoCode]
  const transactionFee = null
  logger.debug('Sending coins [%s] to: %s', cryptoCode, toAddress)

  if (cryptoCode === 'BTC') {
    walletPlugin.sendBitcoins(toAddress, cryptoAtoms.truncated().toNumber(), transactionFee, cb)
  } else {
    walletPlugin.sendBitcoins(toAddress, cryptoAtoms, cryptoCode, transactionFee, cb)
  }
}

// NOTE: This will fail if we have already sent coins because there will be
// a db unique db record in the table already.
function executeTx (deviceId, tx) {
  console.log('DEBUG16: %j', tx)
  return db.addOutgoingTx(deviceId, tx)
  .then(() => _sendCoins(tx.toAddress, tx.cryptoAtoms, tx.cryptoCode))
  .then(txHash => {
    console.log('DEBUG13: %j', txHash)

    const fee = null // Need to fill this out in plugins
    const toSend = {cryptoAtoms: tx.cryptoAtoms, fiat: tx.fiat}

    return db.sentCoins(tx, toSend, fee, null, txHash)
    .then(() => pollBalance(tx.cryptoCode))
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
  const cryptoCode = rawTrade.cryptoCode || 'BTC'
  const traderPlugin = traderPlugins[cryptoCode]

  if (traderPlugin) {
    logger.debug('[%s] Pushing trade: %d', cryptoCode, rawTrade.cryptoAtoms)
    tradesQueues[cryptoCode].push({
      currency: rawTrade.currency,
      cryptoAtoms: rawTrade.cryptoAtoms,
      cryptoCode,
      timestamp: Date.now()
    })
  }

  return db.recordBill(deviceId, rawTrade)
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
  const cryptoCode = tx.cryptoCode || 'BTC'
  const walletPlugin = walletPlugins[cryptoCode]

  const serialPromise = walletPlugin.supportsHD
  ? db.nextCashOutSerialHD(tx.id, cryptoCode)
  : Promise.resolve()

  return serialPromise
  .then(serialNumber => new Promise((resolve, reject) => {
    const tmpInfo = {
      label: 'TX ' + Date.now(),
      account: 'deposit',
      serialNumber
    }

    walletPlugin.newAddress(tmpInfo, (err, address) => {
      if (err) return reject(err)

      const newTx = R.assoc('toAddress', address, tx)
      return db.addInitialIncoming(deviceId, newTx, address)
      .then(() => resolve(address))
    })
  }))
}

exports.dispenseAck = function (deviceId, tx) {
  console.log('DEBUG23: %j', tx)
  const config = getConfig(deviceId)
  const cartridges = [ config.currencies.topCashOutDenomination,
    config.currencies.bottomCashOutDenomination ]

  return db.addDispense(deviceId, tx, cartridges)
}

exports.fiatBalance = function fiatBalance (cryptoCode, deviceId) {
  const config = configManager.scoped(cryptoCode, deviceId, cachedConfig)
  const deviceRate = exports.getDeviceRate(cryptoCode)
  if (!deviceRate) return null
  const rawRate = deviceRate.rates.ask
  const commission = new BigNumber(config.commissions.cashInCommission).div(100)
  const lastBalanceRec = lastBalances[cryptoCode]
  if (!lastBalanceRec) return null
  const lastBalance = lastBalanceRec.balance

  if (!rawRate || !lastBalance) return null

  // The rate is actually our commission times real rate.
  const rate = rawRate.times(commission)

  // `lowBalanceMargin` is our safety net. It's a number > 1, and we divide
  // all our balances by it to provide a safety margin.
  const lowBalanceMargin = config.commissions.lowBalanceMargin || LOW_BALANCE_MARGIN_DEFAULT

  const unitScale = new BigNumber(10).pow(coins[cryptoCode].unitScale)
  const fiatTransferBalance = lastBalance.div(unitScale).times(rate).div(lowBalanceMargin)

  return {timestamp: lastBalanceRec.timestamp, balance: fiatTransferBalance.round(3).toNumber()}
}

function processTxStatus (tx) {
  const cryptoCode = tx.cryptoCode
  const walletPlugin = walletPlugins[cryptoCode]

  if (!walletPlugin) return logger.warn('Trying to check tx status but no wallet plugins for: ' + cryptoCode)

  return walletPlugin.getStatus(tx.toAddress, tx.cryptoAtoms)
  .then(res => db.updateTxStatus(tx, res.status))
  .catch(err => {
    console.log(err.stack)
    logger.error('[%s] Tx status processing error: %s', cryptoCode, err.stack)
  })
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

  return smsPlugin.sendMessage(rec)
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

  const cryptoCodes = getCryptoCodes()
  cryptoCodes.forEach(cryptoCode => {
    setInterval(async.apply(pollBalance, cryptoCode), POLLING_RATE)
    setInterval(async.apply(pollRate, cryptoCode), POLLING_RATE)
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
  // Always start trading, even if we don't have a trade exchange configured,
  // since configuration can always change in `Trader#configure`.
  // `Trader#executeTrades` returns early if we don't have a trade exchange
  // configured at the moment.
  const traderPlugin = traderPlugins[cryptoCode]
  if (!traderPlugin || tradeIntervals[cryptoCode]) return

  logger.debug('[%s] startTrader', cryptoCode)

  tradeIntervals[cryptoCode] = setInterval(
    () => { executeTrades(cryptoCode) },
    TRADE_INTERVAL
  )
}

function stopTrader (cryptoCode) {
  if (!tradeIntervals[cryptoCode]) return

  logger.debug('[%s] stopTrader', cryptoCode)
  clearInterval(tradeIntervals[cryptoCode])
  tradeIntervals[cryptoCode] = null
  tradesQueues[cryptoCode] = []
}

function pollBalance (cryptoCode, cb) {
  logger.debug('[%s] collecting balance', cryptoCode)

  const walletPlugin = walletPlugins[cryptoCode]

  walletPlugin.balance((err, balance) => {
    if (err) {
      logger.error('[%s] Error loading balance: %s', cryptoCode, err.message)
      return cb && cb(err)
    }

    logger.debug('[%s] Balance update: %j', cryptoCode, balance)
    lastBalances[cryptoCode] = {timestamp: Date.now(), balance: new BigNumber(balance[cryptoCode])}

    return cb && cb(null, lastBalances)
  })
}

function pollRate (cryptoCode, cb) {
  const tickerPlugin = tickerPlugins[cryptoCode]
  logger.debug('[%s] polling for rates (%s)', cryptoCode, tickerPlugin.NAME)

  let currencies = deviceCurrency
  if (typeof currencies === 'string') currencies = [currencies]

  const tickerF = cryptoCode === 'BTC'
  ? async.apply(tickerPlugin.ticker, currencies)
  : async.apply(tickerPlugin.ticker, currencies, cryptoCode)

  tickerF((err, resRates) => {
    if (err) {
      logger.error(err)
      return cb && cb(err)
    }

    resRates.timestamp = Date.now()
    const rates = resRates[deviceCurrency].rates
    if (rates) {
      rates.ask = rates.ask && new BigNumber(rates.ask)
      rates.bid = rates.bid && new BigNumber(rates.bid)
    }
    logger.debug('[%s] got rates: %j', cryptoCode, resRates)

    lastRates[cryptoCode] = resRates

    return cb && cb(null, lastRates)
  })
}

/*
 * Getters | Helpers
 */

exports.getDeviceRate = function getDeviceRate (cryptoCode) {
  const lastRate = lastRates[cryptoCode]
  if (!lastRate) return null

  return lastRate[deviceCurrency]
}

/*
 * Trader functions
 */
function purchase (trade, cb) {
  const cryptoCode = trade.cryptoCode
  const traderPlugin = traderPlugins[cryptoCode]
  const opts = {
    cryptoCode,
    fiat: deviceCurrency
  }

  traderPlugin.purchase(trade.cryptoAtoms, opts, err => {
    if (err) return cb(err)
    pollBalance(cryptoCode)
    if (typeof cb === 'function') cb()
  })
}

function consolidateTrades (cryptoCode) {
  // NOTE: value in cryptoAtoms stays the same no matter the currency

  if (tradesQueues[cryptoCode].length === 0) return null

  logger.debug('tradesQueues size: %d', tradesQueues[cryptoCode].length)
  logger.debug('tradesQueues head: %j', tradesQueues[cryptoCode][0])

  const t0 = Date.now()

  const filtered = tradesQueues[cryptoCode]
  .filter(trade => t0 - trade.timestamp < TRADE_TTL)

  const filteredCount = tradesQueues[cryptoCode].length - filtered.length

  if (filteredCount > 0) {
    tradesQueues[cryptoCode] = filtered
    logger.debug('[%s] expired %d trades', cryptoCode, filteredCount)
  }

  const cryptoAtoms = filtered
  .reduce((prev, current) => prev.plus(current.cryptoAtoms), new BigNumber(0))

  const consolidatedTrade = {
    currency: deviceCurrency,
    cryptoAtoms,
    cryptoCode
  }

  tradesQueues[cryptoCode] = []

  logger.debug('[%s] consolidated: %j', cryptoCode, consolidatedTrade)
  return consolidatedTrade
}

function executeTrades (cryptoCode) {
  const traderPlugin = traderPlugins[cryptoCode]
  if (!traderPlugin) return

  logger.debug('[%s] checking for trades', cryptoCode)

  const trade = consolidateTrades(cryptoCode)
  if (trade === null) return logger.debug('[%s] no trades', cryptoCode)

  if (trade.cryptoAtoms.eq(0)) {
    logger.debug('[%s] rejecting 0 trade', cryptoCode)
    return
  }

  logger.debug('making a trade: %d', trade.cryptoAtoms.toString())
  purchase(trade, err => {
    if (err) {
      tradesQueues[cryptoCode].push(trade)
      if (err.name !== 'orderTooSmall') return logger.error(err)
      else return logger.debug(err)
    }
    logger.debug('Successful trade.')
  })
}

/*
 * ID Verifier functions
 */
exports.verifyUser = function verifyUser (data, cb) {
  return new Promise((resolve, reject) => {
    idVerifierPlugin.verifyUser(data, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

exports.verifyTx = function verifyTx (data, cb) {
  return new Promise((resolve, reject) => {
    idVerifierPlugin.verifyTransaction(data, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

function sendMessage (rec) {
  const pluginPromises = []
  const config = configManager.unscoped(cachedConfig)

  if (!config.notifications.notificationsEnabled) return Promise.all([])

  if (config.notifications.notificationsEmailEnabled) {
    pluginPromises.push(emailPlugin.sendMessage(rec))
  }

  if (config.notifications.notificationsSMSEnabled) {
    pluginPromises.push(smsPlugin.sendMessage(rec))
  }

  return Promise.all(pluginPromises)
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
    console.log('DEBUG25')
    if (results && results.length > 0) logger.debug('Successfully sent alerts')
  })
  .catch(err => {
    logger.error(err)
  })
}

function getCryptoCodes (deviceId) {
  return configManager.machineScoped(deviceId, cachedConfig).currencies.cryptoCurrencies
}
exports.getCryptoCodes = getCryptoCodes

// Get union of all cryptoCodes from all machines
function getAllCryptoCodes () {
  return db.devices()
  .then(rows => {
    return rows.reduce((acc, r) => {
      getCryptoCodes(r.device_id).forEach(c => acc.add(c))
      return acc
    }, new Set())
  })
}

function checkBalances () {
  return Promise.all([getAllCryptoCodes(), db.devices()])
  .then(arr => {
    const cryptoCodes = arr[0]
    const deviceIds = arr[1].map(r => r.device_id)
    const balances = []

    cryptoCodes.forEach(cryptoCode => {
      const minBalance = deviceIds.map(deviceId => {
        const fiatBalanceRec = exports.fiatBalance(cryptoCode, deviceId)
        return fiatBalanceRec ? fiatBalanceRec.balance : Infinity
      })
      .reduce((min, cur) => Math.min(min, cur), Infinity)

      const rec = {fiatBalance: minBalance, cryptoCode, fiatCode: deviceCurrency}
      balances.push(rec)
    })

    return balances
  })
}

exports.startCheckingNotification = function startCheckingNotification () {
  const config = configManager.unscoped(cachedConfig)
  notifier.init(db, checkBalances, config.notifications)
  checkNotification()
  setInterval(checkNotification, CHECK_NOTIFICATION_INTERVAL)
}

exports.getPhoneCode = function getPhoneCode (phone) {
  const code = smsPlugin.NAME === 'MockSMS'
  ? '123'
  : BigNumber.random().toFixed(6).slice(2)

  const rec = {
    sms: {
      toNumber: phone,
      body: 'Your cryptomat code: ' + code
    }
  }

  return smsPlugin.sendMessage(rec)
  .then(() => code)
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
  const walletPlugin = walletPlugins[cryptoCode]

  if (!walletPlugin) {
    return logger.warn('Trying to sweep but no plugin set up for: ' + cryptoCode)
  }

  return walletPlugin.sweep(row.hd_serial)
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
