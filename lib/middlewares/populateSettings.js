const _ = require('lodash/fp')

const state = require('./state')
const newSettingsLoader = require('../new-settings-loader')
const helpers = require('../route-helpers')
const logger = require('../logger')

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
    .then(() => helpers.updateDeviceConfigVersion(versionId))
    .then(() => next())
    .catch(next)
}

module.exports = populateSettings
