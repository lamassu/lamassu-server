const { saveConfig, loadLatest } = require('../lib/new-settings-loader')

exports.up = function (next) {
  const newConfig = {
    cashIn_cashboxReset: 'Manual'
  }
  return loadLatest()
    .then(config => {
      return saveConfig(newConfig)
        .then(() => next())
        .catch(err => {
          if (err.message === 'lamassu-server is not configured') {
            return next()
          }
          console.log(err.message)
          return next(err)
        })
    })
}

module.exports.down = function (next) {
  next()
}
