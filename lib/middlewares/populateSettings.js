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
    const operatorSettings = settingsCache.get(operatorId)
    if (!versionId && (!operatorSettings || !!needsSettingsReload[operatorId])) {
      return newSettingsLoader.loadLatest()
        .then(settings => {
          settingsCache.set(operatorId, settings)
          delete needsSettingsReload[operatorId]
          req.settings = settings
        })
        .then(() => next())
        .catch(next)
    }
  
    if (!versionId && operatorSettings) {
      req.settings = operatorSettings
      return next()
    }
  } catch (e) {
    logger.error(e)
  }

  newSettingsLoader.load(versionId)
    .then(settings => { req.settings = settings })
    .then(() => next())
    .catch(next)
}

module.exports = populateSettings
