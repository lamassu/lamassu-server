const _ = require('lodash/fp')

const { saveConfig, loadLatest } = require('../lib/new-settings-loader')

exports.up = function (next) {
  const newConfig = {}
  return loadLatest()
    .then(config => {
      if (!_.isNil(config.config.wallets_ETH_zeroConfLimit) && config.config.wallets_ETH_zeroConfLimit !== 0) {
        newConfig[`wallets_ETH_zeroConfLimit`] = 0
        return saveConfig(newConfig)
      }
    })
    .then(next)
    .catch(err => {
      return next(err)
    })
}

module.exports.down = function (next) {
  next()
}
