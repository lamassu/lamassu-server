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
const settingsLoader = require('./new-settings-loader')
const NodeCache = require('node-cache')
const util = require('util')
const db = require('./db')
const state = require('./middlewares/state')

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
const SANCTIONS_UPDATE_INTERVAL = 1 * T.day
const RADAR_UPDATE_INTERVAL = 5 * T.minutes
const PRUNE_MACHINES_HEARTBEAT = 1 * T.day

const CHECK_NOTIFICATION_INTERVAL = 20 * T.seconds
const PENDING_INTERVAL = 10 * T.seconds
const CACHE_ENTRY_TTL = 3600 // seconds

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

// Fix for asyncLocalStorage store being lost due to callback-based queue
FAST_QUEUE.enqueue = util.promisify(FAST_QUEUE.enqueue)
SLOW_QUEUE.enqueue = util.promisify(SLOW_QUEUE.enqueue)

const QUEUE = {
  FAST: FAST_QUEUE,
  SLOW: SLOW_QUEUE
}

const coinFilter = ['ETH']
const schemaCallbacks = new Map()

const cachedVariables = new NodeCache({
  stdTTL: CACHE_ENTRY_TTL,
  checkperiod: CACHE_ENTRY_TTL,
  deleteOnExpire: false,
  useClones: false // pass values by reference instead of cloning
})

cachedVariables.on('expired', (key, val) => {
  if (!val.isReloading) {
    // since val is passed by reference we don't need to do cachedVariables.set()
    val.isReloading = true
    return reload(key)
  }
})

db.connect({ direct: true }).then(sco => {
  sco.client.on('notification', data => {
    const parsedData = JSON.parse(data.payload)
    switch (parsedData.type) {
      case 'reload':
        return reload(parsedData.schema)
      case 'machineAction':
        return machineAction(parsedData.action, parsedData.value)
      default:
        break
    }
  })
  return sco.none('LISTEN $1:name', 'poller')
}).catch(console.error)

function reload (schema) {
  const store = defaultStore()
  store.set('schema', schema)
  // set asyncLocalStorage so settingsLoader loads settings for the right schema
  return asyncLocalStorage.run(store, () => {
    return settingsLoader.loadLatest().then(settings => {
      const pi = plugins(settings)
      cachedVariables.set(schema, { settings, pi, isReloading: false })
      logger.debug(`Settings for schema '${schema}' reloaded in poller`)
      return updateAndLoadSanctions()
    })
  })
}

function machineAction (type, value) {
  const deviceId = value.deviceId
  const operatorId = value.operatorId
  const pid = state.pids?.[operatorId]?.[deviceId]?.pid

  switch (type) {
    case 'reboot':
      logger.debug(`Rebooting machine '${deviceId}' from operator ${operatorId}`)
      state.reboots[operatorId] = { [deviceId]: pid }
      break
    case 'shutdown':
      logger.debug(`Shutting down machine '${deviceId}' from operator ${operatorId}`)
      state.shutdowns[operatorId] = { [deviceId]: pid }
      break
    case 'restartServices':
      logger.debug(`Restarting services of machine '${deviceId}' from operator ${operatorId}`)
      state.restartServicesMap[operatorId] = { [deviceId]: pid }
      break
    default:
      break
  }
}

function pi () { return cachedVariables.get(asyncLocalStorage.getStore().get('schema')).pi }
function settings () { return cachedVariables.get(asyncLocalStorage.getStore().get('schema')).settings }

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
  return _.forEach(schema => {
    const store = defaultStore()
    store.set('schema', schema)
    return asyncLocalStorage.run(store, () => {
      return settingsLoader.loadLatest().then(settings => {
        // prevent inadvertedly clearing the array without clearing timeouts
        if (schemaCallbacks.has(schema)) throw new Error(`The schema "${schema}" cannot be initialized twice on poller`)
        const pi = plugins(settings)
        cachedVariables.set(schema, { settings, pi, isReloading: false })
        schemaCallbacks.set(schema, [])
        return doPolling(schema)
      })
    }).catch(console.error)
  }, schemas)
}

function addToQueue (func, interval, schema, queue, ...vars) {
  return schemaCallbacks.get(schema).push(setInterval(() => {
    return queue.enqueue().then(() => {
      // get plugins or settings from the cache every time func is run
      const loadVariables = vars.length > 0 && typeof vars[0] === 'function'
      if (loadVariables) {
        const funcVars = [...vars]
        funcVars[0] = vars[0]()
        return func(...funcVars)
      }
      return func(...vars)
    }).catch(console.error)
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
  addToQueue(cashOutTx.monitorLiveIncoming, LIVE_INCOMING_TX_INTERVAL, schema, QUEUE.FAST, settings, false, coinFilter)
  addToQueue(cashOutTx.monitorStaleIncoming, INCOMING_TX_INTERVAL, schema, QUEUE.FAST, settings, false, coinFilter)
  if (!_.isEmpty(coinFilter)) {
    addToQueue(cashOutTx.monitorLiveIncoming, LIVE_INCOMING_TX_INTERVAL_FILTER, schema, QUEUE.FAST, settings, true, coinFilter)
    addToQueue(cashOutTx.monitorStaleIncoming, INCOMING_TX_INTERVAL_FILTER, schema, QUEUE.FAST, settings, true, coinFilter)
  }
  addToQueue(cashOutTx.monitorUnnotified, UNNOTIFIED_INTERVAL, schema, QUEUE.FAST, settings)
  addToQueue(cashInTx.monitorPending, PENDING_INTERVAL, schema, QUEUE.FAST, settings)
  addToQueue(pi().sweepHd, SWEEP_HD_INTERVAL, schema, QUEUE.FAST, settings)
  addToQueue(pi().pong, PONG_INTERVAL, schema, QUEUE.FAST)
  addToQueue(pi().clearOldLogs, LOGS_CLEAR_INTERVAL, schema, QUEUE.SLOW)
  addToQueue(notifier.checkNotification, CHECK_NOTIFICATION_INTERVAL, schema, QUEUE.FAST, pi)
  addToQueue(initialSanctionsDownload, SANCTIONS_INITIAL_DOWNLOAD_INTERVAL, schema, QUEUE.SLOW)
  addToQueue(updateAndLoadSanctions, SANCTIONS_UPDATE_INTERVAL, schema, QUEUE.SLOW)
  addToQueue(updateCoinAtmRadar, RADAR_UPDATE_INTERVAL, schema, QUEUE.SLOW)
  addToQueue(pi().pruneMachinesHeartbeat(), PRUNE_MACHINES_HEARTBEAT, schema, QUEUE.SLOW, settings)
}

function setup (schemasToAdd = [], schemasToRemove = []) {
  // clear callback array for each schema in schemasToRemove and clear cached variables
  _.forEach(schema => {
    const callbacks = schemaCallbacks.get(schema)
    _.forEach(clearInterval, callbacks)
    schemaCallbacks.delete(schema)
    cachedVariables.del(schema)
  }, schemasToRemove)

  return initializeEachSchema(schemasToAdd)
}

const getActiveSchemas = () => Array.from(schemaCallbacks.keys())

module.exports = { setup, reload, getActiveSchemas }
