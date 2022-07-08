const { saveConfig, loadLatest } = require('../lib/new-settings-loader')

exports.up = function (next) {
  const newConfig = {}
  return loadLatest()
    .then(config => {
      if (config.config.locale_timezone === "0:0") {
        newConfig[`locale_timezone`] = 'GMT'
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
