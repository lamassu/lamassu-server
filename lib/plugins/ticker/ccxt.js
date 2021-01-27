const _ = require('lodash/fp')
const axios = require('axios')
const ccxt = require('ccxt')

const BN = require('../../bn')
const { buildMarket, verifyFiatSupport } = require('../common/ccxt')

function ticker (fiatCode, cryptoCode, tickerName) {
  const ticker = new ccxt[tickerName]({ timeout: 3000 })
  if (verifyFiatSupport(fiatCode, tickerName)) {
    return getCurrencyRates(ticker, fiatCode, cryptoCode)
  }
  return axios.get('https://bitpay.com/rates')
    .then(response => {
      try {
        const fxRates = response.data.data
        const usdRate = findCurrencyRates(fxRates, 'USD')
        const fxRate = findCurrencyRates(fxRates, fiatCode).div(usdRate)

        return getCurrencyRates(ticker, 'USD', cryptoCode)
          .then(res => ({
            rates: {
              ask: res.rates.ask.times(fxRate),
              bid: res.rates.bid.times(fxRate)
            }
          }))
      } catch (e) {
        return Promise.reject(e)
      }
    })
}

function getCurrencyRates (ticker, fiatCode, cryptoCode) {
  try {
    if (ticker.has['fetchTicker']) {
      const symbol = buildMarket(fiatCode, cryptoCode, ticker.id)
      return ticker.fetchTicker(symbol)
        .then(res => ({
          rates: {
            ask: BN(res.ask),
            bid: BN(res.bid)
          }
        }))
    }
  } catch (e) {
    return Promise.reject(e)
  }
}

function findCurrencyRates (fxRates, fiatCode) {
  const rates = _.find(_.matchesProperty('code', fiatCode), fxRates)
  if (!rates || !rates.rate) throw new Error(`Unsupported currency: ${fiatCode}`)
  return BN(rates.rate.toString())
}

module.exports = { ticker }
