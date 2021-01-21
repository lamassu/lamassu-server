const configManager = require('./new-config-manager')
const ccxt = require('./plugins/exchange/ccxt')

function lookupExchange (settings, cryptoCode) {
  const exchange = configManager.getWalletSettings(cryptoCode, settings.config).exchange
  if (exchange === 'no-exchange') return null
  return exchange
}

function fetchExchange (settings, cryptoCode) {
  return Promise.resolve()
    .then(() => {
      const exchangeName = lookupExchange(settings, cryptoCode)
      if (!exchangeName) throw new Error('No exchange set')
      const account = settings.accounts[exchangeName]

      return { exchangeName, account }
    })
}

function buy (settings, cryptoAtoms, fiatCode, cryptoCode) {
  return fetchExchange(settings, cryptoCode)
    .then(r => ccxt.trade('buy', r.account, cryptoAtoms, fiatCode, cryptoCode, r.exchangeName))
}

function sell (settings, cryptoAtoms, fiatCode, cryptoCode) {
  return fetchExchange(settings, cryptoCode)
    .then(r => ccxt.trade('sell', r.account, cryptoAtoms, fiatCode, cryptoCode, r.exchangeName))
}

function active (settings, cryptoCode) {
  return !!lookupExchange(settings, cryptoCode)
}

module.exports = {
  buy,
  sell,
  active
}
