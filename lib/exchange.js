const configManager = require('./config-manager')
const ph = require('./plugin-helper')

function lookupExchange (settings, cryptoCode) {
  const exchange = configManager.cryptoScoped(cryptoCode, settings.config).exchange
  if (exchange === 'no-exchange') return null
  return exchange
}

function fetchExchange (settings, cryptoCode) {
  return Promise.resolve()
    .then(() => {
      const plugin = lookupExchange(settings, cryptoCode)
      if (!plugin) throw new Error('No exchange set')
      const exchange = ph.load(ph.EXCHANGE, plugin)
      const account = settings.accounts[plugin]

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
  return !!lookupExchange(settings, cryptoCode)
}

module.exports = {
  buy,
  sell,
  active
}
