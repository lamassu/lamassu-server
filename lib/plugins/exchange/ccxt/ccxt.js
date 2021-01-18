var ccxt = require('ccxt')
const coinUtils = require('../../../coin-utils')
const _ = require('lodash/fp')
const common = require('../../common/ccxt')

function trade (side, account, cryptoAtoms, fiatCode, cryptoCode, exchangeName) {
  try {
    const exchange = setUpExchange(account, exchangeName)
    const symbol = common.verifyCurrencies(exchangeName, fiatCode, cryptoCode)
    const amount = coinUtils.toUnit(cryptoAtoms, cryptoCode).toFixed(8)
    if (exchangeName === 'itbit') {
      return exchange.fetchOrderBook(symbol)
        .then(orderBook => {
          const price = calculatePrice(side, amount, orderBook)
          return exchange.createOrder(symbol, 'limit', side, amount, price, { walletId: account.walletId })
        })
    }
    return exchange.createOrder(symbol, 'market', side, amount)
  } catch (e) {
    return Promise.reject(e)
  }
}

function setUpExchange (account, exchangeName) {
  // map given credentials to cctx properties
  if (!_.includes(exchangeName, ccxt.exchanges)) {
    throw new Error(`Exchange ${exchangeName} not supported by ccxt.`)
  }

  switch (exchangeName) {
    case 'itbit':
      if (!account.clientKey || !account.clientSecret || !account.userId || !account.walletId) {
        throw new Error('Must provide user ID, wallet ID, client key, and client secret')
      }
      return new ccxt[exchangeName](_.mapKeys((key) => {
        if (key === 'clientKey') return 'apiKey'
        if (key === 'clientSecret') return 'secret'
        if (key === 'userId') return 'uid'
        return key
      }, _.omit(['walletId'], account)))
    case 'kraken':
      if (!account.apiKey || !account.privateKey) {
        throw new Error('Must provide key and private key')
      }
      return new ccxt[exchangeName](_.mapKeys((key) => {
        if (key === 'privateKey') return 'secret'
        return key
      }, account))
    case 'bitstamp':
      if (!account.key || !account.secret || !account.clientId) {
        throw new Error('Must provide key, secret and client ID')
      }
      return new ccxt[exchangeName](_.mapKeys((key) => {
        if (key === 'key') return 'apiKey'
        if (key === 'clientId') return 'uid'
        return key
      }, account))
    default:
      throw new Error(`Exchange ${exchangeName} not supported.`)
  }
}

function calculatePrice (side, amount, orderBook) {
  const book = side === 'buy' ? 'asks' : 'bids'
  let collected = 0.0
  for (const entry of orderBook[book]) {
    collected += parseFloat(entry[1])
    if (collected >= amount) return parseFloat(entry[0])
  }
  throw new Error('Insufficient market depth')
}

module.exports = { trade }
