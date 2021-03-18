const state = require('./state')
const settingsCache = require('./settingsCache')
const newSettingsLoader = require('../new-settings-loader')
const helpers = require('../route-helpers')

const SETTINGS_CACHE_REFRESH = 60 * 60 * 1000

const populateSettings = function (req, res, next) {
  const operatorId = res.locals.operatorId
  const versionId = req.headers['config-version']
  if (versionId !== state.oldVersionId) {
    state.oldVersionId = versionId
  }

  try {
    // Clear cache every hour
    if (Date.now() - settingsCache.getTimestamp(operatorId) > SETTINGS_CACHE_REFRESH) {
      settingsCache.clear(operatorId)
    }

    if (!versionId && settingsCache.getCache(operatorId)) {
      req.settings = settingsCache.getCache(operatorId)
      return next()
    }

    if (!versionId && !settingsCache.getCache(operatorId)) {
      return newSettingsLoader.loadLatest()
        .then(settings => {
          settingsCache.setCache(operatorId, settings)
          settingsCache.setTimestamp(operatorId, Date.now())
          req.settings = settings
        })
        .then(() => next())
        .catch(next)
    }
  } catch (e) {
    console.error(e)
  }

  newSettingsLoader.load(versionId)
    .then(settings => { req.settings = settings })
    .then(() => helpers.updateDeviceConfigVersion(versionId))
    .then(() => next())
    .catch(next)
}

module.exports = populateSettings
