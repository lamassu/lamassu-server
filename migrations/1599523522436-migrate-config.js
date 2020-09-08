const settingsLoader = require('../lib/settings-loader')
const { saveConfig, saveAccounts } = require('../lib/new-settings-loader')
const { migrate } = require('../lib/config-migration')

module.exports.up = function (next) {
  settingsLoader.loadLatest()
    .then(settings => migrate(settings.config, settings.accounts))
    .then(newSettings => Promise.all([
      saveConfig(newSettings.config),
      saveAccounts(newSettings.accounts)
    ]))
    .then(() => next())
    .catch(err => console.error(err))
}

module.exports.down = function (next) {
  next()
}
