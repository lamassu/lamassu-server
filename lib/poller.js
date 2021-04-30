const _ = require('lodash/fp')
const Queue = require('queue-promise')
const plugins = require('./plugins')
const notifier = require('./notifier')
const T = require('./time')
const logger = require('./logger')
const cashOutTx = require('./cash-out/cash-out-tx')
const cashInTx = require('./cash-in/cash-in-tx')
const sanctionsUpdater = require('./ofac/update')
const sanctions = require('./ofac/index')
const coinAtmRadar = require('./coinatmradar/coinatmradar')
const configManager = require('./new-config-manager')
const complianceTriggers = require('./compliance-triggers')
const { asyncLocalStorage, defaultStore } = require('./async-storage')

const INCOMING_TX_INTERVAL = 30 * T.seconds
const LIVE_INCOMING_TX_INTERVAL = 5 * T.seconds
const INCOMING_TX_INTERVAL_FILTER = 1 * T.minute
const LIVE_INCOMING_TX_INTERVAL_FILTER = 10 * T.seconds
const UNNOTIFIED_INTERVAL = 10 * T.seconds
const SWEEP_HD_INTERVAL = T.minute
const TRADE_INTERVAL = 60 * T.seconds
const PONG_INTERVAL = 10 * T.seconds
const LOGS_CLEAR_INTERVAL = 1 * T.day
const SANCTIONS_INITIAL_DOWNLOAD_INTERVAL = 5 * T.minutes
const SANCTIONS_UPDATE_INTERVAL = 1 * T.week
const RADAR_UPDATE_INTERVAL = 5 * T.minutes
const CHECK_NOTIFICATION_INTERVAL = 20 * T.seconds
const PENDING_INTERVAL = 10 * T.seconds

const FAST_QUEUE_WAIT = 1 * T.seconds
const SLOW_QUEUE_WAIT = 10 * T.seconds

const FAST_QUEUE = new Queue({
  concurrent: 600,
  interval: FAST_QUEUE_WAIT
})
const SLOW_QUEUE = new Queue({
  concurrent: 10,
  interval: SLOW_QUEUE_WAIT
})

const QUEUE = {
  FAST: FAST_QUEUE,
  SLOW: SLOW_QUEUE
}

const coinFilter = ['ETH']
const schemaCallbacks = new Map()

let _pi, _settings

function reload (__settings) {
  _settings = __settings
  _pi = plugins(_settings)
  logger.debug('settings reloaded in poller')
  updateAndLoadSanctions()
}

function pi () { return _pi }
function settings () { return _settings }

function initialSanctionsDownload () {
  const structs = sanctions.getStructs()
  const isEmptyStructs = _.isNil(structs) || _.flow(_.values, _.all(_.isEmpty))(structs)

  if (!isEmptyStructs) return Promise.resolve()

  return updateAndLoadSanctions()
}

function updateAndLoadSanctions () {
  const triggers = configManager.getTriggers(settings().config)
  const hasSanctions = complianceTriggers.hasSanctions(triggers)

  if (!hasSanctions) return Promise.resolve()

  logger.info('Updating sanctions database...')
  return sanctionsUpdater.update()
    .then(sanctions.load)
    .then(() => logger.info('Sanctions database updated.'))
}

function updateCoinAtmRadar () {
  return pi().getRawRates()
    .then(rates => coinAtmRadar.update(rates, settings()))
}

function initializeEachSchema (schemas = ['public']) {
  // for each schema set "thread variables" and do polling
  _.forEach(schema => {
    // prevent memory leak from inadvertedly clearing the array without clearing timeouts
    if (schemaCallbacks.has(schema)) throw new Error('The same schema cannot be initialized twice on poller')
    const store = defaultStore()
    store.set('schema', schema)
    asyncLocalStorage.run(store, () => {
      schemaCallbacks.set(schema, [])
      doPolling(schema)
    })
  }, schemas)
}

function addToQueue (func, interval, schema, queue, ...funcVars) {
  return schemaCallbacks.get(schema).push(setInterval(() => {
    return queue.enqueue(() => func(...funcVars))
  }, interval))
}

function doPolling (schema) {
  pi().executeTrades()
  pi().pong()
  pi().clearOldLogs()
  cashOutTx.monitorLiveIncoming(settings(), false, coinFilter)
  cashOutTx.monitorStaleIncoming(settings(), false, coinFilter)
  if (!_.isEmpty(coinFilter)) {
    cashOutTx.monitorLiveIncoming(settings(), true, coinFilter)
    cashOutTx.monitorStaleIncoming(settings(), true, coinFilter)
  }
  cashOutTx.monitorUnnotified(settings())
  pi().sweepHd()
  notifier.checkNotification(pi())
  updateCoinAtmRadar()

  addToQueue(pi().executeTrades, TRADE_INTERVAL, schema, QUEUE.FAST)
  addToQueue(cashOutTx.monitorLiveIncoming, LIVE_INCOMING_TX_INTERVAL, schema, QUEUE.FAST, settings(), false, coinFilter)
  addToQueue(cashOutTx.monitorStaleIncoming, INCOMING_TX_INTERVAL, schema, QUEUE.FAST, settings(), false, coinFilter)
  if (!_.isEmpty(coinFilter)) {
    addToQueue(cashOutTx.monitorLiveIncoming, LIVE_INCOMING_TX_INTERVAL_FILTER, schema, QUEUE.FAST, settings(), true, coinFilter)
    addToQueue(cashOutTx.monitorStaleIncoming, INCOMING_TX_INTERVAL_FILTER, schema, QUEUE.FAST, settings(), true, coinFilter)
  }
  addToQueue(cashOutTx.monitorUnnotified, UNNOTIFIED_INTERVAL, schema, QUEUE.FAST, settings())
  addToQueue(cashInTx.monitorPending, PENDING_INTERVAL, schema, QUEUE.FAST, settings())
  addToQueue(pi().sweepHd, SWEEP_HD_INTERVAL, schema, QUEUE.FAST, settings())
  addToQueue(pi().pong, PONG_INTERVAL, schema, QUEUE.FAST)
  addToQueue(pi().clearOldLogs, LOGS_CLEAR_INTERVAL, schema, QUEUE.SLOW)
  addToQueue(notifier.checkNotification, CHECK_NOTIFICATION_INTERVAL, schema, QUEUE.FAST, pi())
  addToQueue(initialSanctionsDownload, SANCTIONS_INITIAL_DOWNLOAD_INTERVAL, schema, QUEUE.SLOW)
  addToQueue(updateAndLoadSanctions, SANCTIONS_UPDATE_INTERVAL, schema, QUEUE.SLOW)
  addToQueue(updateCoinAtmRadar, RADAR_UPDATE_INTERVAL, schema, QUEUE.SLOW)
}

function setup (__settings = null, schemasToAdd = [], schemasToRemove = []) {
  if (!settings() && !__settings) throw new Error('Poller must be initialized for the first time with the settings object')
  if (__settings) reload(__settings)
  _.forEach(schema => {
    const callbacks = schemaCallbacks.get(schema)
    _.forEach(clearInterval, callbacks)
    schemaCallbacks.delete(schema)
  }, schemasToRemove)
  return initializeEachSchema(schemasToAdd)
}

module.exports = { setup, reload }
