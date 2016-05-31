'use strict'

var R = require('ramda')
var async = require('async')

var BigNumber = require('bignumber.js')
BigNumber.config({CRYPTO: true})

var logger = require('./logger')
var notifier = require('./notifier')

var uuid = require('node-uuid')
var tradeIntervals = {}

var CHECK_NOTIFICATION_INTERVAL = 60 * 1000
var ALERT_SEND_INTERVAL = 60 * 60 * 1000
var POLLING_RATE = 60 * 1000 // poll each minute
var INCOMING_TX_INTERVAL = 5 * 1000
var LIVE_INCOMING_TX_INTERVAL = 30 * 1000
var STALE_INCOMING_TX_AGE = 7 * 24 * 60 * 60 * 1000
var UNNOTIFIED_INTERVAL = 60 * 1000
var MAX_NOTIFY_AGE = 48 * 60 * 60 * 1000
var MIN_NOTIFY_AGE = 5 * 60 * 1000
var TRANSACTION_EXPIRATION = 48 * 60 * 60 * 1000

var db = null

var cryptoCodes = null

var tickerPlugins = {}
var traderPlugins = {}
var walletPlugins = {}
var idVerifierPlugin = null
var infoPlugin = null
var emailPlugin = null
var smsPlugin = null

var currentlyUsedPlugins = {}

var cachedConfig = null
var deviceCurrency = 'USD'

var lastBalances = {}
var lastRates = {}

var tradesQueues = {}

var coins = {
  BTC: {unitScale: 8},
  ETH: {unitScale: 18}
}

var alertFingerprint = null
var lastAlertTime = null

// that's basically a constructor
exports.init = function init (databaseHandle) {
  if (!databaseHandle) {
    throw new Error('\'db\' is required')
  }

  db = databaseHandle
}

function loadPlugin (name, config) {
  // plugins definitions
  var moduleMethods = {
    ticker: ['ticker'],
    trader: ['purchase', 'sell'],
    wallet: ['balance', 'sendBitcoins', 'newAddress'],
    idVerifier: ['verifyUser', 'verifyTransaction'],
    info: ['checkAddress'],
    email: ['sendMessage']
  }

  var plugin = null

  // each used plugin MUST be installed
  try {
    plugin = require('lamassu-' + name)
  } catch (_) {
    throw new Error(name + ' module is not installed. ' +
        'Try running \'npm install --save lamassu-' + name + '\' first')
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

  plugin.SUPPORTED_MODULES.forEach(function (moduleName) {
    moduleMethods[moduleName].forEach(function (methodName) {
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
    plugin.config = function () {}
  } else if (config !== null) {
    plugin.config(config, logger) // only when plugin supports it, and config is passed
  }

  return plugin
}

function loadOrConfigPlugin (pluginHandle, pluginType, cryptoCode, currency,
    onChangeCallback) {
  cryptoCode = cryptoCode || 'BTC'

  var currentName = cryptoCode === 'any' || cryptoCode === 'BTC'
  ? cachedConfig.exchanges.plugins.current[pluginType]
  : cachedConfig.exchanges.plugins.current[cryptoCode][pluginType]

  currentlyUsedPlugins[cryptoCode] = currentlyUsedPlugins[cryptoCode] || {}

  var pluginChanged = currentlyUsedPlugins[cryptoCode][pluginType] !== currentName

  if (!currentName) pluginHandle = null
  else { // some plugins may be disabled
    var pluginConfig = cachedConfig.exchanges.plugins.settings[currentName] || {}

    if (currency) pluginConfig.currency = currency

    if (pluginHandle && !pluginChanged) pluginHandle.config(pluginConfig)
    else {
      pluginHandle = loadPlugin(currentName, pluginConfig)
      currentlyUsedPlugins[cryptoCode] = currentlyUsedPlugins[cryptoCode] || {}
      currentlyUsedPlugins[cryptoCode][pluginType] = currentName
      logger.debug('[%s] plugin(%s) loaded: %s', cryptoCode, pluginType, pluginHandle.NAME ||
        currentName)
    }
  }

  if (typeof onChangeCallback === 'function') onChangeCallback(pluginHandle, currency)

  return pluginHandle
}
exports.loadOrConfigPlugin = loadOrConfigPlugin

// Note: this whole function gets called every time there's a config update
exports.configure = function configure (config) {
  if (config.exchanges.settings.lowBalanceMargin < 1) {
    throw new Error('\'settings.lowBalanceMargin\' has to be >= 1')
  }

  cachedConfig = config
  deviceCurrency = config.exchanges.settings.currency
  cryptoCodes = config.exchanges.settings.coins || ['BTC', 'ETH']

  cryptoCodes.forEach(function (cryptoCode) {
  // TICKER [required] configure (or load)
    loadOrConfigPlugin(
      tickerPlugins[cryptoCode],
      'ticker',
      cryptoCode,
      deviceCurrency, // device currency
      function onTickerChange (newTicker) {
        tickerPlugins[cryptoCode] = newTicker
        pollRate(cryptoCode)
      }
    )

    // WALLET [required] configure (or load)
    loadOrConfigPlugin(
      walletPlugins[cryptoCode],
      'transfer',
      cryptoCode,
      null,
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
      null,
      function onTraderChange (newTrader) {
        traderPlugins[cryptoCode] = newTrader
        if (newTrader === null) stopTrader(cryptoCode)
        else startTrader(cryptoCode)
      }
    )
  })

  // ID VERIFIER [optional] configure (or load)
  idVerifierPlugin = loadOrConfigPlugin(
    idVerifierPlugin,
    'idVerifier'
  )

  infoPlugin = loadOrConfigPlugin(
    infoPlugin,
    'info'
  )

  emailPlugin = loadOrConfigPlugin(
    emailPlugin,
    'email'
  )

  smsPlugin = loadOrConfigPlugin(
    smsPlugin,
    'sms'
  )
}

exports.getConfig = function getConfig () {
  return cachedConfig
}

exports.logEvent = function event (session, rawEvent) {
  return db.recordDeviceEvent(session, rawEvent)
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
    virtualCartridges: virtualCartridges,
    id: rec.id
  }
}

exports.pollQueries = function pollQueries (session, cb) {
  var cartridges = cachedConfig.exchanges.settings.cartridges
  if (!cartridges) return cb(null, {})
  var virtualCartridges = cachedConfig.exchanges.settings.virtualCartridges

  return db.cartridgeCounts(session)
  .then(result => ({
    cartridges: buildCartridges(cartridges, virtualCartridges, result)
  }))
}

function _sendCoins (toAddress, cryptoAtoms, cryptoCode) {
  return new Promise((resolve, reject) => {
    _sendCoinsCb(toAddress, cryptoAtoms, cryptoCode, (err, txHash) => {
      if (err) return reject(err)
      return resolve(txHash)
    })
  })
}

function _sendCoinsCb (toAddress, cryptoAtoms, cryptoCode, cb) {
  var walletPlugin = walletPlugins[cryptoCode]
  var transactionFee = cachedConfig.exchanges.settings.transactionFee
  logger.debug('Sending coins [%s] to: %s', cryptoCode, toAddress)

  if (cryptoCode === 'BTC') {
    walletPlugin.sendBitcoins(toAddress, cryptoAtoms.truncated().toNumber(), transactionFee, cb)
  } else {
    walletPlugin.sendBitcoins(toAddress, cryptoAtoms, cryptoCode, transactionFee, cb)
  }
}

function executeTx (session, tx) {
  return db.addOutgoingTx(session, tx)
  .then(() => _sendCoins(tx.toAddress, tx.cryptoAtoms, tx.cryptoCode))
  .then(txHash => {
    const fee = null // Need to fill this out in plugins
    const toSend = {cryptoAtoms: tx.cryptoAtoms, fiat: tx.fiat}

    return db.sentCoins(session, tx, toSend, fee, null, txHash)
    .then(() => pollBalance(tx.cryptoCode))
    .then(() => ({
      statusCode: 201, // Created
      txHash: txHash,
      txId: tx.txId
    }))
  })
}

// TODO: Run these in parallel and return success
exports.trade = function trade (session, rawTrade) {
  // TODO: move this to DB, too
  // add bill to trader queue (if trader is enabled)
  var cryptoCode = rawTrade.cryptoCode || 'BTC'
  var traderPlugin = traderPlugins[cryptoCode]

  if (traderPlugin) {
    logger.debug('[%s] Pushing trade: %d', cryptoCode, rawTrade.cryptoAtoms)
    tradesQueues[cryptoCode].push({
      currency: rawTrade.currency,
      cryptoAtoms: rawTrade.cryptoAtoms,
      cryptoCode: cryptoCode
    })
  }

  return db.recordBill(session, rawTrade)
}

exports.stateChange = function stateChange (session, rec, cb) {
  var event = {
    id: rec.uuid,
    fingerprint: session.fingerprint,
    eventType: 'stateChange',
    note: JSON.stringify({state: rec.state, isIdle: rec.isIdle, sessionId: session.id}),
    deviceTime: session.deviceTime
  }
  return db.machineEvent(event)
}

exports.recordPing = function recordPing (session, rec, cb) {
  var event = {
    id: uuid.v4(),
    fingerprint: session.fingerprint,
    eventType: 'ping',
    note: JSON.stringify({state: rec.state, isIdle: rec.idle === 'true', sessionId: session.id}),
    deviceTime: session.deviceTime
  }
  return db.machineEvent(event)
}

exports.sendCoins = function sendCoins (session, rawTx) {
  var _session = {id: rawTx.sessionId || session.id, fingerprint: session.fingerprint}
  return executeTx(_session, rawTx)
}

exports.cashOut = function cashOut (session, tx) {
  var tmpInfo = {
    label: 'TX ' + Date.now(),
    account: 'deposit'
  }

  var cryptoCode = tx.cryptoCode || 'BTC'
  var walletPlugin = walletPlugins[cryptoCode]

  return new Promise((resolve, reject) => {
    walletPlugin.newAddress(tmpInfo, function (err, address) {
      if (err) return reject(err)

      const newTx = R.assoc('toAddress', address, tx)
      return db.addInitialIncoming(session, newTx)
      .then(() => resolve(address))
    })
  })
}

exports.dispenseAck = function dispenseAck (session, rec) {
  return db.addDispense(session, rec.tx, rec.cartridges)
}

exports.fiatBalance = function fiatBalance (cryptoCode) {
  var deviceRate = exports.getDeviceRate(cryptoCode)
  if (!deviceRate) return null
  var rawRate = deviceRate.rates.ask
  var commission = cachedConfig.exchanges.settings.commission
  var lastBalance = lastBalances[cryptoCode]

  if (!rawRate || !lastBalance) return null

  // The rate is actually our commission times real rate.
  var rate = rawRate.times(commission)

  // `lowBalanceMargin` is our safety net. It's a number > 1, and we divide
  // all our balances by it to provide a safety margin.
  var lowBalanceMargin = cachedConfig.exchanges.settings.lowBalanceMargin

  var unitScale = new BigNumber(10).pow(coins[cryptoCode].unitScale)
  var fiatTransferBalance = lastBalance.div(unitScale).times(rate).div(lowBalanceMargin)

  return fiatTransferBalance.round(3).toNumber()
}

function processTxStatus (tx) {
  return new Promise((resolve, reject) => {
    const cryptoCode = tx.cryptoCode
    const walletPlugin = walletPlugins[cryptoCode]

    if (!walletPlugin) throw new Error('No wallet plugins for: ' + cryptoCode)
    walletPlugin.getStatus(tx.toAddress, tx.cryptoAtoms, function (err, res) {
      if (err) {
        logger.error(err)
        return resolve()  // Resolve on error because we ignore errors
      }

      var status = res.status
      if (tx.status === status) return resolve()

      const confirm = (status === 'instant' && tx.status !== 'confirmed') ||
        (status === 'confirmed' && tx.status !== 'instant')
      db.updateTxStatus(tx, status, confirm).then(resolve).catch(reject)
    })
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
  db.fetchOpenTxs(statuses, STALE_INCOMING_TX_AGE)
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

  cryptoCodes.forEach(function (cryptoCode) {
    setInterval(async.apply(pollBalance, cryptoCode), POLLING_RATE)
    setInterval(async.apply(pollRate, cryptoCode), POLLING_RATE)
    startTrader(cryptoCode)
  })

  setInterval(monitorLiveIncoming, LIVE_INCOMING_TX_INTERVAL)
  setInterval(monitorIncoming, INCOMING_TX_INTERVAL)
  setInterval(monitorUnnotified, UNNOTIFIED_INTERVAL)

  monitorLiveIncoming()
  monitorIncoming()
  monitorUnnotified()
}

function startTrader (cryptoCode) {
  // Always start trading, even if we don't have a trade exchange configured,
  // since configuration can always change in `Trader#configure`.
  // `Trader#executeTrades` returns early if we don't have a trade exchange
  // configured at the moment.
  var traderPlugin = traderPlugins[cryptoCode]
  if (!traderPlugin || tradeIntervals[cryptoCode]) return

  logger.debug('[%s] startTrader', cryptoCode)

  tradeIntervals[cryptoCode] = setInterval(
    function () { executeTrades(cryptoCode) },
    cachedConfig.exchanges.settings.tradeInterval
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

  var walletPlugin = walletPlugins[cryptoCode]

  walletPlugin.balance(function (err, balance) {
    if (err) {
      logger.error(err)
      return cb && cb(err)
    }

    logger.debug('[%s] Balance update: %j', cryptoCode, balance)
    balance.timestamp = Date.now()
    lastBalances[cryptoCode] = new BigNumber(balance[cryptoCode])

    return cb && cb(null, lastBalances)
  })
}

function pollRate (cryptoCode, cb) {
  var tickerPlugin = tickerPlugins[cryptoCode]
  logger.debug('[%s] polling for rates (%s)', cryptoCode, tickerPlugin.NAME)

  var currencies = deviceCurrency
  if (typeof currencies === 'string') currencies = [currencies]

  var tickerF = cryptoCode === 'BTC'
  ? async.apply(tickerPlugin.ticker, currencies)
  : async.apply(tickerPlugin.ticker, currencies, cryptoCode)

  tickerF(function (err, resRates) {
    if (err) {
      logger.error(err)
      return cb && cb(err)
    }

    resRates.timestamp = Date.now()
    var rates = resRates[deviceCurrency].rates
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
  var lastRate = lastRates[cryptoCode]
  if (!lastRate) return null

  return lastRate[deviceCurrency]
}

exports.getBalance = function getBalance (cryptoCode) {
  var lastBalance = lastBalances[cryptoCode]

  return lastBalance
}

/*
 * Trader functions
 */
function purchase (trade, cb) {
  var cryptoCode = trade.cryptoCode
  var traderPlugin = traderPlugins[cryptoCode]
  var opts = {
    cryptoCode: cryptoCode,
    fiat: deviceCurrency
  }

  traderPlugin.purchase(trade.cryptoAtoms, opts, function (err) {
    if (err) return cb(err)
    pollBalance(cryptoCode)
    if (typeof cb === 'function') cb()
  })
}

function consolidateTrades (cryptoCode) {
  // NOTE: value in cryptoAtoms stays the same no matter the currency

  logger.debug('tradesQueues size: %d', tradesQueues[cryptoCode].length)
  logger.debug('tradesQueues head: %j', tradesQueues[cryptoCode][0])
  var cryptoAtoms = tradesQueues[cryptoCode].reduce(function (prev, current) {
    return prev.plus(current.cryptoAtoms)
  }, new BigNumber(0))

  var consolidatedTrade = {
    currency: deviceCurrency,
    cryptoAtoms: cryptoAtoms,
    cryptoCode: cryptoCode
  }

  tradesQueues[cryptoCode] = []

  logger.debug('[%s] consolidated: %j', cryptoCode, consolidatedTrade)
  return consolidatedTrade
}

function executeTrades (cryptoCode) {
  var traderPlugin = traderPlugins[cryptoCode]
  if (!traderPlugin) return

  logger.debug('[%s] checking for trades', cryptoCode)

  var trade = consolidateTrades(cryptoCode)

  if (trade.cryptoAtoms.eq(0)) {
    logger.debug('[%s] rejecting 0 trade', cryptoCode)
    return
  }

  logger.debug('making a trade: %d', trade.cryptoAtoms.toString())
  purchase(trade, function (err) {
    if (err) {
      logger.debug(err)
      tradesQueues[cryptoCode].push(trade)
      if (err.name !== 'orderTooSmall') logger.error(err)
    }
    logger.debug('Successful trade.')
  })
}

/*
 * ID Verifier functions
 */
exports.verifyUser = function verifyUser (data, cb) {
  idVerifierPlugin.verifyUser(data, cb)
}

exports.verifyTx = function verifyTx (data, cb) {
  idVerifierPlugin.verifyTransaction(data, cb)
}

exports.getcryptoCodes = function getcryptoCodes () {
  return cryptoCodes
}

function sendMessage (rec) {
  var pluginTypes = JSON.parse(cachedConfig.exchanges.plugins.current.notify)
  var pluginPromises = pluginTypes.map(function (pluginType) {
    if (pluginType === 'email') return emailPlugin.sendMessage(rec)
    if (pluginType === 'sms') return smsPlugin.sendMessage(rec)
    throw new Error('No such plugin type: ' + pluginType)
  })
  return Promise.all(pluginPromises)
}
exports.sendMessage = sendMessage

function sendNoAlerts () {
  var subject = '[Lamassu] All clear'
  var rec = {
    sms: {
      body: subject
    },
    email: {
      subject: subject,
      body: 'No errors are reported for your machines.'
    }
  }
  return sendMessage(rec)
}

function checkNotification () {
  return notifier.checkStatus()
  .then(function (alertRec) {
    var fingerprint = notifier.alertFingerprint(alertRec)
    if (!fingerprint) {
      var inAlert = !!alertFingerprint
      alertFingerprint = null
      lastAlertTime = null
      if (inAlert) return sendNoAlerts()
    }

    var alertChanged = fingerprint === alertFingerprint &&
      lastAlertTime - Date.now() < ALERT_SEND_INTERVAL
    if (alertChanged) return

    var subject = notifier.alertSubject(alertRec)
    var rec = {
      sms: {
        body: subject
      },
      email: {
        subject: subject,
        body: notifier.printEmailAlerts(alertRec)
      }
    }
    alertFingerprint = fingerprint
    lastAlertTime = Date.now()

    return sendMessage(rec)
  })
  .then(function () {
    logger.debug('Successfully sent alerts')
  })
  .catch(function (err) {
    logger.error(err)
  })
}

function checkBalances () {
  var cryptoCodes = exports.getcryptoCodes()

  var balances = []
  cryptoCodes.forEach(function (cryptoCode) {
    var balance = exports.fiatBalance(cryptoCode)
    if (!balance) return
    var rec = {fiatBalance: balance, cryptoCode: cryptoCode, fiatCode: deviceCurrency}
    balances.push(rec)
  })

  return balances
}

exports.startCheckingNotification = function startCheckingNotification () {
  var config = cachedConfig.exchanges.plugins.settings.notifier
  notifier.init(db, checkBalances, config)
  checkNotification()
  setInterval(checkNotification, CHECK_NOTIFICATION_INTERVAL)
}

exports.getPhoneCode = function getPhoneCode (phone) {
  const code = BigNumber.random().toFixed(6).slice(2)
  const rec = {
    sms: {
      toNumber: phone,
      body: 'Your cryptomat code: ' + code
    }
  }

  return smsPlugin.sendMessage(rec)
  .then(() => code)
}

exports.updatePhone = function updatePhone (session, tx, notified) {
  return db.addIncomingPhone(session, tx, notified)
}

exports.registerRedeem = function registerRedeem (session) {
  return db.updateRedeem(session)
}

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

exports.fetchTx = function fetchTx (session) {
  return db.fetchTx(session)
}

exports.requestDispense = function requestDispense (tx) {
  return db.addDispenseRequest(tx)
}

exports.cachedResponse = function (session, path, method) {
  return db.cachedResponse(session, path, method)
}

exports.cacheResponse = function (session, path, method, body) {
  return db.cacheResponse(session, path, method, body)
}
