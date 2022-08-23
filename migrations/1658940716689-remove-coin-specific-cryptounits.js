const { removeFromConfig, loadLatest } = require('../lib/new-settings-loader')
const { getCryptosFromWalletNamespace } = require('../lib/new-config-manager.js')
const _ = require('lodash/fp')

exports.up = function (next) {
  loadLatest()
    .then(settings => {
      const configuredCryptos = getCryptosFromWalletNamespace(settings.config)
      if (!configuredCryptos.length) return Promise.resolve()

      return removeFromConfig(_.map(it => `wallets_${it}_cryptoUnits`, configuredCryptos))
    })
    .then(() => next())
    .catch(err => {
      console.log(err.message)
      return next(err)
    })
}

exports.down = function (next) {
  next()
}
