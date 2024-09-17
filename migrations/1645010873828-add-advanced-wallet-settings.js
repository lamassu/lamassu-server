const uuid = require('uuid')
const { saveConfig } = require('../lib/new-settings-loader')

exports.up = function (next) {
  const newConfig = {
    wallets_advanced_feeMultiplier: '1',
    wallets_advanced_cryptoUnits: 'full',
    wallets_advanced_allowTransactionBatching: false,
    wallets_advanced_id: uuid.v4(),
  }
  return saveConfig(newConfig)
    .then(next)
    .catch(err => {
      return next(err)
    })
}

module.exports.down = function (next) {
  next()
}
