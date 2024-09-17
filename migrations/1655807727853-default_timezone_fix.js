const { saveConfig, loadLatestConfig } = require('../lib/new-settings-loader')

exports.up = function (next) {
  return loadLatestConfig()
    .then(config => {
      if (config.locale_timezone === "0:0") {
        const newConfig = { locale_timezone: 'GMT' }
        return saveConfig(newConfig)
      }
    })
    .then(next)
    .catch(err => {
      return next(err)
    })
}

module.exports.down = function (next) {
  next()
}
