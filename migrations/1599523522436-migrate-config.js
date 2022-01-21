const db = require('./db')
const machineLoader = require('../lib/machine-loader')
const { migrationSaveConfig, saveAccounts, loadLatest } = require('../lib/new-settings-loader')
const { migrate } = require('../lib/config-migration')

const _ = require('lodash/fp')

const OLD_SETTINGS_LOADER_SCHEMA_VERSION = 1

module.exports.up = function (next) {
  function migrateConfig (settings) {
    const newSettings = migrate(settings.config, settings.accounts)
    return Promise.all([
      migrationSaveConfig(newSettings.config),
      saveAccounts(newSettings.accounts)
    ])
      .then(() => next())
  }

  loadLatest(OLD_SETTINGS_LOADER_SCHEMA_VERSION)
    .then(settings => _.isEmpty(settings.config)
        ? next()
        : migrateConfig(settings)
    )
    .catch(err => {
      if (err.message === 'lamassu-server is not configured') {
        return next()
      }
      console.log(err.message)
      return next(err)
    })
}

module.exports.down = function (next) {
  next()
}
