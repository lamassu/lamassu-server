const configManager = require('./config-manager')
const settingsLoader = require('./settings-loader')

function noExchangeError (cryptoCode) {
  const err = new Error('No exchange plugin defined for: ' + cryptoCode)
  err.name = 'NoExchangeError'

  return err
}

function fetchExchange (cryptoCode) {
  return Promise.resolve()
  .then(() => {
    const settings = settingsLoader.settings()
    const plugin = configManager.cryptoScoped(cryptoCode, settings.config).cryptoServices.exchange
    if (!plugin) throw noExchangeError(cryptoCode)
    const account = settings.accounts[plugin]
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

module.exports = {
  buy,
  sell
}
