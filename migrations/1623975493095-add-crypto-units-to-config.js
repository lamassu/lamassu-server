const { saveConfig } = require('../lib/new-settings-loader')

exports.up = function (next) {
  const cryptoUnits = {
    wallets_BTC_cryptoUnits: 'mUnits',
    wallets_ETH_cryptoUnits: 'mUnits',
    wallets_LTC_cryptoUnits: 'mUnits',
    wallets_ZEC_cryptoUnits: 'mUnits',
    wallets_BCH_cryptoUnits: 'mUnits'
  }

  return saveConfig(cryptoUnits)
    .then(() => next())
    .catch(err => {
      console.log(err.message)
      return next(err)
    })
}

exports.down = function (next) {
  next()
}
