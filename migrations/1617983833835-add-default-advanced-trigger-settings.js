const { saveConfig } = require('../lib/new-settings-loader')

exports.up = function (next) {
  const triggersDefault = {
    triggersConfig_expirationTime: 'Forever',
    triggersConfig_automation: 'Automatic'
  }

  return saveConfig(triggersDefault)
    .then(() => next())
    .catch(err => {
      console.log(err.message)
      return next(err)
    })
}

exports.down = function (next) {
  next()
}
