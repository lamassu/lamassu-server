const NodeCache = require('node-cache')
const SETTINGS_CACHE_REFRESH = 3600

module.exports = (function () {
  return {
    oldVersionId: 'unset',
    settingsCache: new NodeCache({
      stdTTL: SETTINGS_CACHE_REFRESH,
      checkperiod: SETTINGS_CACHE_REFRESH // Clear cache every hour
    }),
    canLogClockSkewMap: {},
    canGetLastSeenMap: {},
    pids: {},
    reboots: {},
    shutdowns: {},
    restartServicesMap: {},
    mnemonic: null
  }
}())
