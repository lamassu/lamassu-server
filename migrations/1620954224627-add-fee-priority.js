const _ = require('lodash/fp')
const { saveConfig, loadLatest } = require('../lib/new-settings-loader')
const { getCryptosFromWalletNamespace } = require('../lib/new-config-manager')

exports.up = function (next) {
  const newConfig = {}
  return loadLatest()
    .then(config => {
      const coins = getCryptosFromWalletNamespace(config)
      _.map(coin => { newConfig[`wallets_${coin}_feeMultiplier`] = '1' }, coins)
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
