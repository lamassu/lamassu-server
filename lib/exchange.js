const _ = require('lodash/fp')
const { ALL_CRYPTOS } = require('@lamassu/coins')

const configManager = require('./new-config-manager')
const ccxt = require('./plugins/exchange/ccxt')
const mockExchange = require('./plugins/exchange/mock-exchange')
const accounts = require('./new-admin/config/accounts')

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

function buy (settings, tradeEntry) {
  const { cryptoAtoms, fiatCode, cryptoCode } = tradeEntry
  return fetchExchange(settings, cryptoCode)
    .then(r => {
      if (r.exchangeName === 'mock-exchange') {
        return mockExchange.buy(cryptoAtoms, fiatCode, cryptoCode)
      }
      return ccxt.trade('buy', r.account, tradeEntry, r.exchangeName)
    })
}

function sell (settings, tradeEntry) {
  const { cryptoAtoms, fiatCode, cryptoCode } = tradeEntry
  return fetchExchange(settings, cryptoCode)
    .then(r => {
      if (r.exchangeName === 'mock-exchange') {
        return mockExchange.sell(cryptoAtoms, fiatCode, cryptoCode)
      }
      return ccxt.trade('sell', r.account, tradeEntry, r.exchangeName)
    })
}

function active (settings, cryptoCode) {
  return !!lookupExchange(settings, cryptoCode)
}

function getMarkets () {
  const filterExchanges = _.filter(it => it.class === 'exchange')
  const availableExchanges = _.map(it => it.code, filterExchanges(accounts.ACCOUNT_LIST))

  return _.reduce(
    (acc, value) =>
    Promise.all([acc, ccxt.getMarkets(value, ALL_CRYPTOS)])
      .then(([a, markets]) => Promise.resolve({
        ...a,
        [value]: markets
      })),
    Promise.resolve({}),
    availableExchanges
  )
}

module.exports = {
  fetchExchange,
  buy,
  sell,
  active,
  getMarkets
}
