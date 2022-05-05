const { saveConfig } = require('../lib/new-settings-loader')

exports.up = function (next) {
  return saveConfig({})
    .then(next)
    .catch(next)
}

exports.down = function (next) {
  next()
}
