const configManager = require('./config-manager')
const settingsLoader = require('./settings-loader')

function fetchExchange (cryptoCode) {
  return Promise.resolve()
  .then(() => {
    const settings = settingsLoader.settings
    const plugin = configManager.cryptoScoped(cryptoCode, settings.config).cryptoServices.wallet
    if (!plugin) throw new Error('No exchange plugin defined for: ' + cryptoCode)
    const account = settings.accounts.plugin
    const exchange = require('lamassu-' + plugin)

    return {exchange, account}
  })
}

function buy (cryptoAtoms, fiatCode, cryptoCode) {
  return fetchExchange(cryptoCode)
  .then(r => r.exchange.buy(r.account, cryptoAtoms, fiatCode, cryptoCode))
}

function sell (cryptoAtoms, fiatCode, cryptoCode) {
  return fetchExchange(cryptoCode)
  .then(r => r.exchange.sell(r.account, cryptoAtoms, fiatCode, cryptoCode))
}

function active (cryptoCode) {
  return fetchExchange(cryptoCode)
  .then(() => true)
  .catch(() => false)
}

module.exports = {
  buy,
  sell,
  active
}
