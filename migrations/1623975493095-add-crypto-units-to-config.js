const { saveConfig } = require('../lib/new-settings-loader')

exports.up = function (next) {
  const cryptoUnits = {
    wallets_BTC_cryptoUnits: 'mili',
    wallets_ETH_cryptoUnits: 'mili',
    wallets_LTC_cryptoUnits: 'mili',
    wallets_ZEC_cryptoUnits: 'mili',
    wallets_BCH_cryptoUnits: 'mili'
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
