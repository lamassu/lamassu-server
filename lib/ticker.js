const mem = require('mem')
const configManager = require('./new-config-manager')
const logger = require('./logger')
const ccxt = require('./plugins/ticker/ccxt')
const lastRate = {}

const FETCH_INTERVAL = 60000

function _getRates (settings, fiatCode, cryptoCode) {
  return Promise.resolve()
    .then(() => {
      const config = settings.config
      const exchangeName = configManager.getWalletSettings(cryptoCode, config).ticker
      const market = [cryptoCode, fiatCode].join('-')

      return ccxt.ticker(exchangeName, fiatCode, cryptoCode)
        .then(r => ({
          rates: r.rates,
          timestamp: Date.now()
        }))
        .then(r => {
          lastRate[market] = r
          return r
        })
        .catch(err => {
          logger.error(err)
          return lastRate[market]
        })
    })
}

const getRates = mem(_getRates, {
  maxAge: FETCH_INTERVAL,
  cacheKey: (settings, fiatCode, cryptoCode) => JSON.stringify([fiatCode, cryptoCode])
})

module.exports = { getRates }
