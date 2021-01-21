var ccxt = require('ccxt')
const coinUtils = require('../../coin-utils')
const common = require('../common/ccxt')
const kraken = require('./kraken')
const bitstamp = require('./bitstamp')
const itbit = require('./itbit')
const consts = require('./consts')

const ALL_EXCHANGES = {
  kraken,
  bitstamp,
  itbit
}

function trade (side, account, cryptoAtoms, fiatCode, cryptoCode, exchangeName) {
  try {
    const exchangeConfig = ALL_EXCHANGES[exchangeName]

    if (!exchangeConfig) throw Error('no exchange')
    if (exchangeConfig.isConfigValid && !exchangeConfig.isConfigValid(account)) throw Error('Invalid config')

    const exchange = new ccxt[exchangeName](exchangeConfig.loadConfig(account))

    const symbol = common.verifyCurrencies(exchangeName, fiatCode, cryptoCode)
    const precision = exchangeConfig.amountPrecision ? exchangeConfig.amountPrecision() : consts.DECIMAL_PRECISION.DEFAULT_AMOUNT
    const amount = coinUtils.toUnit(cryptoAtoms, cryptoCode).toFixed(precision)
    const options = exchangeConfig.loadOptions ? exchangeConfig.loadOptions(account) : {}
    if (exchangeConfig.ORDER_TYPE === consts.ORDER_TYPES.MARKET) {
      return exchange.createOrder(symbol, consts.ORDER_TYPES.MARKET, side, amount, null, options)
    }
    return exchange.fetchOrderBook(symbol)
      .then(orderBook => {
        const price = calculatePrice(side, amount, orderBook).toFixed(consts.DECIMAL_PRECISION.PRICE)
        return exchange.createOrder(symbol, consts.ORDER_TYPES.LIMIT, side, amount, price, options)
      })
  } catch (e) {
    return Promise.reject(e)
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
