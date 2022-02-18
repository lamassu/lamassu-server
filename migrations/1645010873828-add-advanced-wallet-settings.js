const uuid = require('uuid')
const { saveConfig, loadLatest } = require('../lib/new-settings-loader')

exports.up = function (next) {
  const newConfig = {}
  return loadLatest()
    .then(config => {
      newConfig[`wallets_advanced_feeMultiplier`] = '1'
      newConfig[`wallets_advanced_cryptoUnits`] = 'full'
      newConfig[`wallets_advanced_allowTransactionBatching`] = false
      newConfig[`wallets_advanced_id`] = uuid.v4()
      return saveConfig(newConfig)
    })
    .then(next)
    .catch(err => {
      return next(err)
    })
}

module.exports.down = function (next) {
  next()
}
