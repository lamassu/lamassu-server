const { utils: coinUtils } = require('@lamassu/coins')
const _ = require('lodash/fp')
const mem = require('mem')

const configManager = require('./new-config-manager')
const logger = require('./logger')
const lastRate = {}

const ccxt = require('./plugins/ticker/ccxt')
const mockTicker = require('./plugins/ticker/mock-ticker')
const bitpay = require('./plugins/ticker/bitpay')

const FETCH_INTERVAL = 58000

const PEGGED_FIAT_CURRENCIES = { NAD: 'ZAR' }

const getFallbackTicker = ticker =>
  _.difference(['bitpay', 'kraken', 'bitstamp'], [ticker])[0]

const hasRatesOrReject = emsg => r => _.get(['rates'], r) ?
  r :
  Promise.reject(new Error(emsg))

const get1 = (market, fiatCode, cryptoCode, ticker, emsg) =>
  buildTicker(fiatCode, cryptoCode, ticker)
    .then(hasRatesOrReject(emsg))
    .then(({ rates }) => {
      return lastRate[market] = { rates, timestamp: Date.now() }
    })

const _getRates = (settings, fiatCode, cryptoCode) => Promise.resolve()
  .then(() => {
    const ticker = configManager.getWalletSettings(cryptoCode, settings.config).ticker
    const market = [cryptoCode, fiatCode].join('-')
    const fallbackTicker = getFallbackTicker(ticker)
    const emsg = fallbackTicker ?
      "Failed to get rates with configured ticker, trying fallback" :
      "Failed to get ticker rates"
    return get1(market, fiatCode, cryptoCode, ticker, emsg)
      .catch(err => {
        logger.error(err)
        return fallbackTicker ?
          get1(market, fiatCode, cryptoCode, fallbackTicker, "Failed to get rates with fallback ticker") :
          lastRate[market]
      })
      .then(hasRatesOrReject("Failed to get ticker rates"))
  })

function buildTicker (fiatCode, cryptoCode, tickerName) {
  fiatCode = _.defaultTo(fiatCode, _.get([fiatCode], PEGGED_FIAT_CURRENCIES))
  cryptoCode = coinUtils.getEquivalentCode(cryptoCode)

  if (tickerName === 'bitpay') return bitpay.ticker(fiatCode, cryptoCode)
  if (tickerName === 'mock-ticker') return mockTicker.ticker(fiatCode, cryptoCode)
  return ccxt.ticker(fiatCode, cryptoCode, tickerName)
}

const getRates = mem(_getRates, {
  maxAge: FETCH_INTERVAL,
  cacheKey: (settings, fiatCode, cryptoCode) => JSON.stringify([fiatCode, cryptoCode])
})

module.exports = { getRates }
