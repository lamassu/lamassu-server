const mem = require('mem')
const configManager = require('./config-manager')
const ph = require('./plugin-helper')
const logger = require('./logger')

const lastRate = {}

const FETCH_INTERVAL = 60000

function _getRates (settings, fiatCode, cryptoCode) {
  return Promise.resolve()
    .then(() => {
      const config = settings.config
      const plugin = configManager.cryptoScoped(cryptoCode, config).ticker

      const account = settings.accounts[plugin]
      const ticker = ph.load(ph.TICKER, plugin)

      const market = [cryptoCode, fiatCode].join('-')

      return ticker.ticker(account, fiatCode, cryptoCode)
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
