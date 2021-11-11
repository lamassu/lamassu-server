const state = require('./state')
const newSettingsLoader = require('../new-settings-loader')
const helpers = require('../route-helpers')
const logger = require('../logger')

const { settingsCache } = state

const populateSettings = function (req, res, next) {
  const operatorId = res.locals.operatorId
  const versionId = req.headers['config-version']
  if (versionId !== state.oldVersionId) {
    state.oldVersionId = versionId
  }

  try {
    const operatorSettings = settingsCache.get(operatorId)
    if (!versionId && operatorSettings) {
      req.settings = operatorSettings
      return next()
    }

    if (!versionId && !operatorSettings) {
      return newSettingsLoader.loadLatest()
        .then(settings => {
          settingsCache.set(operatorId, settings)
          req.settings = settings
        })
        .then(() => next())
        .catch(next)
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
