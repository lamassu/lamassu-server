const configManager = require('./config-manager')

function fetchExchange (settings, cryptoCode) {
  return Promise.resolve()
  .then(() => {
    const plugin = configManager.cryptoScoped(cryptoCode, settings.config).cryptoServices.wallet
    if (!plugin) throw new Error('No exchange plugin defined for: ' + cryptoCode)
    const account = settings.accounts.plugin
    const exchange = require('lamassu-' + plugin)

    return {exchange, account}
  })
}

function buy (settings, cryptoAtoms, fiatCode, cryptoCode) {
  return fetchExchange(settings, cryptoCode)
  .then(r => r.exchange.buy(r.account, cryptoAtoms, fiatCode, cryptoCode))
}

function sell (settings, cryptoAtoms, fiatCode, cryptoCode) {
  return fetchExchange(settings, cryptoCode)
  .then(r => r.exchange.sell(r.account, cryptoAtoms, fiatCode, cryptoCode))
}

function active (settings, cryptoCode) {
  return fetchExchange(settings, cryptoCode)
  .then(() => true)
  .catch(() => false)
}

module.exports = {
  buy,
  sell,
  active
}
