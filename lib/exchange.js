const configManager = require('./config-manager')

function noExchangeError (cryptoCode) {
  const err = new Error('No exchange plugin defined for: ' + cryptoCode)
  err.name = 'NoExchangeError'

  return err
}

function lookupExchange (settings, cryptoCode) {
  return configManager.cryptoScoped(cryptoCode, settings.config).exchange
}

function fetchExchange (settings, cryptoCode) {
  return Promise.resolve()
  .then(() => {
    const plugin = lookupExchange(cryptoCode)
    if (!plugin) throw noExchangeError(cryptoCode)
    const account = settings.accounts[plugin]
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

function active (settings, fiatCode, cryptoCode) {
  return !!lookupExchange(settings, cryptoCode)
}

module.exports = {
  buy,
  sell,
  active
}
