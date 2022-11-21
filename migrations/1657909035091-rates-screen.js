const _ = require('lodash/fp')
const { saveConfig, loadLatest } = require('../lib/new-settings-loader')

exports.up = function (next) {
  const newConfig = {}
  return loadLatest()
    .then(({ config }) => {
      if (!_.isNil(config.machineScreens_rates_active)) return
      newConfig[`machineScreens_rates_active`] = true
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
