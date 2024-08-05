const fs = require('fs/promises')
const path = require('path')
const _ = require('lodash/fp')
const Queue = require('queue-promise')
const plugins = require('./plugins')
const notifier = require('./notifier')
const T = require('./time')
const logger = require('./logger')
const cashOutTx = require('./cash-out/cash-out-tx')
const cashInTx = require('./cash-in/cash-in-tx')
const customers = require('./customers')
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
const processBatches = require('./tx-batching-processing')

const INCOMING_TX_INTERVAL = 30 * T.seconds
const LIVE_INCOMING_TX_INTERVAL = 5 * T.seconds
const UNNOTIFIED_INTERVAL = 10 * T.seconds
const SWEEP_HD_INTERVAL = 5 * T.minute
const TRADE_INTERVAL = 60 * T.seconds
const PONG_INTERVAL = 10 * T.seconds
const LOGS_CLEAR_INTERVAL = 1 * T.day
const SANCTIONS_INITIAL_DOWNLOAD_INTERVAL = 5 * T.minutes
const SANCTIONS_UPDATE_INTERVAL = 1 * T.day
const RADAR_UPDATE_INTERVAL = 5 * T.minutes
const PRUNE_MACHINES_HEARTBEAT = 1 * T.day
const TRANSACTION_BATCH_LIFECYCLE = 20 * T.minutes
const TICKER_RATES_INTERVAL = 59 * T.seconds
const FAILED_SCANS_INTERVAL = 1 * T.day
const EXTERNAL_COMPLIANCE_INTERVAL = 1 * T.minutes

const CHECK_NOTIFICATION_INTERVAL = 20 * T.seconds
const PENDING_INTERVAL = 10 * T.seconds
const CACHE_ENTRY_TTL = 3600 // seconds

const FAST_QUEUE_WAIT = 1 * T.seconds
const SLOW_QUEUE_WAIT = 10 * T.seconds

const OPERATOR_DATA_DIR = process.env.OPERATOR_DATA_DIR

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
    return reload(parsedData.schema)
  })
  return sco.none('LISTEN $1:name', 'reload')
}).catch(console.error)

function reload (schema) {
  const store = defaultStore()
  store.set('schema', schema)
  // set asyncLocalStorage so settingsLoader loads settings for the right schema
  return asyncLocalStorage.run(store, () => {
    return settingsLoader.loadLatest()
      .then(settings => {
        const pi = plugins(settings)
        cachedVariables.set(schema, { settings, pi, isReloading: false })
        logger.debug(`Settings for schema '${schema}' reloaded in poller`)
        return updateAndLoadSanctions()
      })
  })
}

function pi () { return cachedVariables.get('public').pi }
function settings () { return cachedVariables.get('public').settings }

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

const readdir = dirpath =>
  fs.readdir(dirpath, { withFileTypes: true })
    .then(_.map(entry => _.set('path', path.join(dirpath, entry.name), entry)))

const readdirRec = rootPath =>
  readdir(rootPath)
    .then(entries => Promise.all(
      entries.map(entry => entry.isDirectory() ? readdirRec(entry.path) : [entry])
    ))
    .then(_.flatten)

const stat = path => fs.stat(path).then(_.set('path', path))
const pathComponents = p => path.normalize(p).split(path.sep)

// @see lib/customers.js:updateIdCardData()
const cleanOldFailedPDF417Scans = () => {
  const matcher = (c, pat) => typeof pat === 'function' ? pat(c) : c === pat
  const PDF417ScanPathPattern = _.concat(
    pathComponents(OPERATOR_DATA_DIR),
    ["id-operator", s => /* customerid*/ true, "idcarddata", fname => path.extname(fname) === 'jpg']
  )
  const isPDF417Scan = entry => {
    entry = pathComponents(entry.path)
    return entry.length === PDF417ScanPathPattern.length
      && _.isMatchWith(matcher, PDF417ScanPathPattern, pathComponents(entry.path))
  }

  let old = new Date()
  old.setDate(old.getDate() - 2) // 2 days ago
  old = old.getTime()

  /* NOTE: Small caveat to mtime: last time the file was written to. */
  const isOld = filestat => filestat.mtimeMs < old

  readdirRec(path.join(OPERATOR_DATA_DIR, 'id-operator'))
    .then(entries => Promise.all(
      entries
        .filter(entry => entry.isFile() && isPDF417Scan(entry))
        .map(entry => stat(entry.path))
    ))
    .then(filestats => Promise.all(
      filestats
        .filter(isOld)
        .map(_.flow(_.get(['path']), fs.unlink))
    ))
    .catch(err => {
      console.log("Error cleaning up failed PDF417 scans:", err)
    })
}

// @see lib/machine-loader.js:updateFailedQRScans()
const cleanOldFailedQRScans = () => {
  const old = new Date()
  old.setDate(old.getDate() - 2) // 2 days ago

  const isOld = filepath => {
    const then = new Date(path.basename(filepath).replace(/-[0-9]+\.jpg$/, ''))
    return then < old
  }

  readdirRec(path.join(OPERATOR_DATA_DIR, 'failedQRScans'))
    .then(entries => Promise.all(
      entries
        .filter(entry => entry.isFile() && isOld(entry.path))
        .map(entry => fs.unlink(entry.path))
    ))
    .catch(err => {
      console.log("Error cleaning up failed QR scans:", err)
    })
}

// function checkExternalCompliance (settings) {
//   return customers.checkExternalCompliance(settings)
// }

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

function recursiveTimeout (func, timeout, ...vars) {
  setTimeout(() => {
    let promise = null

    const loadVariables = vars.length > 0 && typeof vars[0] === 'function'
    if (loadVariables) {
      const funcVars = [...vars]
      funcVars[0] = vars[0]()
      promise = func(...funcVars)
    } else {
      promise = func(...vars)
    }

    promise.finally(() => {
      recursiveTimeout(func, timeout, ...vars)
    })
  }, timeout)
}

function addToQueue (func, interval, schema, queue, ...vars) {
  recursiveTimeout(func, interval, ...vars)
  // return schemaCallbacks.get(schema).push(setInterval(() => {
    // return queue.enqueue().then(() => {
    //   // get plugins or settings from the cache every time func is run
    //   const loadVariables = vars.length > 0 && typeof vars[0] === 'function'
    //   if (loadVariables) {
    //     const funcVars = [...vars]
    //     funcVars[0] = vars[0]()
    //     return func(...funcVars)
    //   }
    //   return func(...vars)
    // }).catch(console.error)
  // }, interval))
}

function doPolling (schema) {
  pi().executeTrades()
  pi().pong()
  pi().clearOldLogs()
  cashOutTx.monitorLiveIncoming(settings())
  cashOutTx.monitorStaleIncoming(settings())
  cashOutTx.monitorUnnotified(settings())
  pi().sweepHd()
  notifier.checkNotification(pi())
  updateCoinAtmRadar()
  // checkExternalCompliance(settings())

  addToQueue(pi().getRawRates, TICKER_RATES_INTERVAL, schema, QUEUE.FAST)
  addToQueue(pi().executeTrades, TRADE_INTERVAL, schema, QUEUE.FAST)
  addToQueue(cashOutTx.monitorLiveIncoming, LIVE_INCOMING_TX_INTERVAL, schema, QUEUE.FAST, settings)
  addToQueue(cashOutTx.monitorStaleIncoming, INCOMING_TX_INTERVAL, schema, QUEUE.FAST, settings)
  addToQueue(cashOutTx.monitorUnnotified, UNNOTIFIED_INTERVAL, schema, QUEUE.FAST, settings)
  addToQueue(cashInTx.monitorPending, PENDING_INTERVAL, schema, QUEUE.FAST, settings)
  addToQueue(processBatches, UNNOTIFIED_INTERVAL, schema, QUEUE.FAST, settings, TRANSACTION_BATCH_LIFECYCLE)
  addToQueue(pi().sweepHd, SWEEP_HD_INTERVAL, schema, QUEUE.FAST, settings)
  addToQueue(pi().pong, PONG_INTERVAL, schema, QUEUE.FAST)
  addToQueue(pi().clearOldLogs, LOGS_CLEAR_INTERVAL, schema, QUEUE.SLOW)
  addToQueue(notifier.checkNotification, CHECK_NOTIFICATION_INTERVAL, schema, QUEUE.FAST, pi)
  addToQueue(initialSanctionsDownload, SANCTIONS_INITIAL_DOWNLOAD_INTERVAL, schema, QUEUE.SLOW)
  addToQueue(updateAndLoadSanctions, SANCTIONS_UPDATE_INTERVAL, schema, QUEUE.SLOW)
  addToQueue(updateCoinAtmRadar, RADAR_UPDATE_INTERVAL, schema, QUEUE.SLOW)
  addToQueue(pi().pruneMachinesHeartbeat, PRUNE_MACHINES_HEARTBEAT, schema, QUEUE.SLOW, settings)
  addToQueue(cleanOldFailedQRScans, FAILED_SCANS_INTERVAL, schema, QUEUE.SLOW, settings)
  addToQueue(cleanOldFailedPDF417Scans, FAILED_SCANS_INTERVAL, schema, QUEUE.SLOW, settings)
  // addToQueue(checkExternalCompliance, EXTERNAL_COMPLIANCE_INTERVAL, schema, QUEUE.SLOW, settings)
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
