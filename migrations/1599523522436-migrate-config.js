const db = require('./db')
const settingsLoader = require('../lib/settings-loader')
const machineLoader = require('../lib/machine-loader')
const { saveConfig, saveAccounts } = require('../lib/new-settings-loader')
const { migrate } = require('../lib/config-migration')

module.exports.up = function (next) {
  function migrateConfig(settings) {
    return migrate(settings.config, settings.accounts)
      .then(newSettings => Promise.all([
        saveConfig(newSettings.config),
        saveAccounts(newSettings.accounts)
      ]))
      .then(() => next())
  }

  settingsLoader.loadLatest(false)
    .then(async settings => ({
      settings,
      machines: await machineLoader.getMachineNames(settings.config)
    }))
    .then(({ settings, machines }) => {
      const sql = machines 
        ? machines.map(m => `update devices set name = '${m.name}' where device_id = '${m.deviceId}'`)
        : []
      return db.multi(sql, () => migrateConfig(settings))
    })
    .catch(err => {
      if (err.message = 'lamassu-server is not configured')
        next()
      
      console.log(err.message)
    })
}

module.exports.down = function (next) {
  next()
}
