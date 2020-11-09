const mem = require('mem')
const configManager = require('./new-config-manager')
const ph = require('./plugin-helper')
const logger = require('./logger')
const axios = require('axios')

const lastRate = {}

const FETCH_INTERVAL = 60000

function _getRates(settings, fiatCode, cryptoCode) {
  return Promise.resolve().then(() => {
    const config = settings.config
    const plugin = configManager.getWalletSettings(cryptoCode, config).ticker

    const account = settings.accounts[plugin]
    const ticker = ph.load(ph.TICKER, plugin)

    const market = [cryptoCode, fiatCode].join('-')

    return ticker
      .ticker(account, fiatCode, cryptoCode)
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
  cacheKey: (settings, fiatCode, cryptoCode) =>
    JSON.stringify([fiatCode, cryptoCode])
})

const getBtcRates = (to = null, from = 'USD') => {
  // if to !== null, then we return only the rates with from (default USD) and to (so an array with 2 items)

  return axios.get('https://bitpay.com/api/rates').then(response => {
    const fxRates = response.data
    if (to === null) {
      return fxRates
    }
    const toRate = fxRates.find(o => o.code === to)
    const fromRate = fxRates.find(o => o.code === from)

    let res = []
    if (toRate && to !== from) {
      res = [...res, toRate]
    }
    if (fromRate) {
      res = [...res, fromRate]
    }

    return res
  })
}

module.exports = { getBtcRates, getRates }
