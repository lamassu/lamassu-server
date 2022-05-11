const _ = require('lodash/fp')
const settingsLoader = require('../lib/new-settings-loader')

exports.up = function (next) {
  settingsLoader.loadLatest()
    .then(({ config }) => {
      if (!_.isEmpty(config))
        config.locale_timezone = '0:0'
      return settingsLoader.migrationSaveConfig(config)
    })
    .then(() => next())
    .catch(err => next(err))

}

exports.down = function (next) {
  next()
}
