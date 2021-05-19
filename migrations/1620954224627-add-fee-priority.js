const { saveConfig, loadLatest } = require('../lib/new-settings-loader')

exports.up = function (next) {
  const newConfig = {
    wallets_BTC_feeDiscount: 'Default'
  }
  return loadLatest()
    .then(config => {
      return saveConfig(newConfig)
        .then(() => next())
        .catch(err => {
          console.log(err.message)
          return next(err)
        })
    })
}

module.exports.down = function (next) {
  next()
}