const _ = require('lodash/fp')
const ccxt = require('ccxt')

const { toUnit } = require('../../coin-utils')
const { buildMarket, ALL, isConfigValid } = require('../common/ccxt')
const { ORDER_TYPES } = require('./consts')

const DEFAULT_PRICE_PRECISION = 2
const DEFAULT_AMOUNT_PRECISION = 8

function trade (side, account, tradeEntry, exchangeName) {
  const { cryptoAtoms, fiatCode, cryptoCode, tradeId } = tradeEntry
  try {
    const exchangeConfig = ALL[exchangeName]
    if (!exchangeConfig) throw Error('Exchange configuration not found')

    const { USER_REF, loadOptions, loadConfig = _.noop, REQUIRED_CONFIG_FIELDS, ORDER_TYPE, AMOUNT_PRECISION } = exchangeConfig
    if (!isConfigValid(account, REQUIRED_CONFIG_FIELDS)) throw Error('Invalid config')

    const symbol = buildMarket(fiatCode, cryptoCode, exchangeName)
    const precision = _.defaultTo(DEFAULT_AMOUNT_PRECISION, AMOUNT_PRECISION)
    const amount = toUnit(cryptoAtoms, cryptoCode).toFixed(precision)
    const accountOptions = _.isFunction(loadOptions) ? loadOptions(account) : {}
    const withCustomKey = USER_REF ? { [USER_REF]: tradeId } : {}
    const options = _.assign(accountOptions, withCustomKey)
    const exchange = new ccxt[exchangeName](loadConfig(account))

    if (ORDER_TYPE === ORDER_TYPES.MARKET) {
      return exchange.createOrder(symbol, ORDER_TYPES.MARKET, side, amount, null, options)
    }

    return exchange.fetchOrderBook(symbol)
      .then(orderBook => {
        const price = calculatePrice(side, amount, orderBook).toFixed(DEFAULT_PRICE_PRECISION)
        return exchange.createOrder(symbol, ORDER_TYPES.LIMIT, side, amount, price, options)
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
