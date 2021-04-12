const { saveConfig } = require('../lib/new-settings-loader')

exports.up = function (next) {
  const triggersDefault = {
    triggersConfig_expirationTime: 'Forever',
    triggersConfig_automation: 'Automatic'
  }

  return saveConfig(triggersDefault)
    .then(() => next())
    .catch(err => {
      if (err.message === 'lamassu-server is not configured') {
        next()
      }
      console.log(err.message)
    })
}

exports.down = function (next) {
  next()
}
