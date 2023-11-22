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

function _getRates (settings, fiatCode, cryptoCode) {
  return Promise.resolve()
    .then(() => {
      const config = settings.config
      const tickerName = configManager.getWalletSettings(cryptoCode, config).ticker
      const market = [cryptoCode, fiatCode].join('-')

      return buildTicker(fiatCode, cryptoCode, tickerName)
        .then(r => {
          return lastRate[market] = {
            rates: r.rates,
            timestamp: Date.now()
          }
        })
        .catch(err => {
          logger.error(err)
          return lastRate[market]
        })
    })
}

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
