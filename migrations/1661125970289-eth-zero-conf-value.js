const _ = require('lodash/fp')

const { saveConfig, loadLatestConfig } = require('../lib/new-settings-loader')

exports.up = function (next) {
  return loadLatestConfig()
    .then(config => {
      if (!_.isNil(config.wallets_ETH_zeroConfLimit) && config.wallets_ETH_zeroConfLimit !== 0) {
        const newConfig = { wallets_ETH_zeroConfLimit: 0 }
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
