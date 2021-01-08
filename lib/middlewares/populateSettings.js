const state = require('./state')
const settingsCache = require('./settingsCache')
const newSettingsLoader = require('../new-settings-loader')
const helpers = require('../route-helpers')

const SETTINGS_CACHE_REFRESH = 60 * 60 * 1000

const populateSettings = function (req, res, next) {
  const versionId = req.headers['config-version']
  if (versionId !== state.oldVersionId) {
    state.oldVersionId = versionId
  }

  // Clear cache every hour
  if (Date.now() - settingsCache.getTimestamp() > SETTINGS_CACHE_REFRESH) {
    settingsCache.clearCache()
  }

  if (!versionId && settingsCache.getCache()) {
    req.settings = settingsCache.getCache()
    return next()
  }

  if (!versionId && !settingsCache.getCache()) {
    return newSettingsLoader.loadLatest()
      .then(settings => {
        settingsCache.setCache(settings)
        settingsCache.setTimestamp(Date.now())
        req.settings = settings
      })
      .then(() => next())
      .catch(next)
  }

  newSettingsLoader.load(versionId)
    .then(settings => { req.settings = settings })
    .then(() => helpers.updateDeviceConfigVersion(versionId))
    .then(() => next())
    .catch(next)
}

module.exports = populateSettings