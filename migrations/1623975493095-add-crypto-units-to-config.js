const { saveConfig, loadLatest } = require('../lib/new-settings-loader')
const { getCryptosFromWalletNamespace } = require('../lib/new-config-manager.js')
const { utils: coinUtils } = require('lamassu-coins')
const _ = require('lodash/fp')

exports.up = function (next) {
  loadLatest()
    .then(settings => {
      const newSettings = {}
      const activeCryptos = getCryptosFromWalletNamespace(settings.config)
      if (!activeCryptos.length) return Promise.resolve()
      _.map(crypto => {
        const defaultUnit = _.head(_.keys(coinUtils.getCryptoCurrency(crypto).units))
        newSettings[`wallets_${crypto}_cryptoUnits`] = defaultUnit
        return newSettings
      }, activeCryptos)
      return saveConfig(newSettings)
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
