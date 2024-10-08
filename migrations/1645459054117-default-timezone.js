const _ = require('lodash/fp')
const { saveConfig, loadLatestConfig } = require('../lib/new-settings-loader')

exports.up = function (next) {
  return loadLatestConfig()
    .then(config => {
      if (!_.isNil(config.locale_timezone)) return
      const newConfig = { locale_timezone: 'GMT' }
      return saveConfig(newConfig)
    })
    .then(next)
    .catch(err => {
      return next(err)
    })
}

module.exports.down = function (next) {
  next()
}
