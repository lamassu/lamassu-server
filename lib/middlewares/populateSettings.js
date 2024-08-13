const db = require('../db')
const state = require('./state')
const newSettingsLoader = require('../new-settings-loader')
const logger = require('../logger')

db.connect({ direct: true }).then(sco => {
  sco.client.on('notification', data => {
    const parsedData = JSON.parse(data.payload)
    return reload(parsedData.operatorId)
  })
  return sco.none('LISTEN $1:name', 'reload')
}).catch(console.error)

db.connect({ direct: true }).then(sco => {
  sco.client.on('notification', data => {
    const parsedData = JSON.parse(data.payload)
    return machineAction(parsedData.action, parsedData.value)
  })
  return sco.none('LISTEN $1:name', 'machineAction')
}).catch(console.error)

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
    case 'emptyUnit':
      logger.debug(`Emptying units from machine '${deviceId}' from operator ${operatorId}`)
      state.emptyUnit[operatorId] = { [deviceId]: pid }
      break
    case 'refillUnit':
      logger.debug(`Refilling recyclers from machine '${deviceId}' from operator ${operatorId}`)
      state.refillUnit[operatorId] = { [deviceId]: pid }
      break
    case 'diagnostics':
      logger.debug(`Running diagnostics on machine '${deviceId}' from operator ${operatorId}`)
      state.diagnostics[operatorId] = { [deviceId]: pid }
    default:
      break
  }
}

function reload (operatorId) {
  state.needsSettingsReload[operatorId] = true
}

const populateSettings = function (req, res, next) {
  const { needsSettingsReload, settingsCache } = state
  const operatorId = res.locals.operatorId
  const versionId = req.headers['config-version']
  if (versionId !== state.oldVersionId) {
    state.oldVersionId = versionId
  }

  try {
    // Priority of configs to retrieve
    // 1. Machine is in the middle of a transaction and has the config-version header set, fetch that config from cache or database, depending on whether it exists in cache
    // 2. The operator settings changed, so we must update the cache
    // 3. There's a cached config, send the cached value
    // 4. There's no cached config, cache and send the latest config

    if (versionId) {
      const cachedVersionedSettings = settingsCache.get(`${operatorId}-v${versionId}`)

      if (!cachedVersionedSettings) {
        logger.debug('Fetching a specific config version cached value')
        return newSettingsLoader.load(versionId)
          .then(settings => {
            settingsCache.set(`${operatorId}-v${versionId}`, settings)
            req.settings = settings
          })
          .then(() => next())
          .catch(next)
      }

      logger.debug('Fetching a cached specific config version')
      req.settings = cachedVersionedSettings
      return next()
    }

    const operatorSettings = settingsCache.get(`${operatorId}-latest`)

    if (!!needsSettingsReload[operatorId] || !operatorSettings) {
      !!needsSettingsReload[operatorId]
        ? logger.debug('Fetching and caching a new latest config value, as a reload was requested')
        : logger.debug('Fetching the latest config version because there\'s no cached value')

      return newSettingsLoader.loadLatest()
        .then(settings => {
          const versionId = settings.version
          settingsCache.set(`${operatorId}-latest`, settings)
          settingsCache.set(`${operatorId}-v${versionId}`, settings)
          if (!!needsSettingsReload[operatorId]) delete needsSettingsReload[operatorId]
          req.settings = settings
        })
        .then(() => next())
        .catch(next)
    }

    logger.debug('Fetching the latest config value from cache')
    req.settings = operatorSettings
    return next()
  } catch (e) {
    logger.error(e)
  }
}

module.exports = populateSettings
