const ccxt = require('ccxt')

const BN = require('../../bn')
const { buildMarket, verifyFiatSupport } = require('../common/ccxt')
const { getRate } = require('../../../lib/forex')

const RETRIES = 2

function ticker (fiatCode, cryptoCode, tickerName) {
  const ticker = new ccxt[tickerName]({ timeout: 3000 })
  if (verifyFiatSupport(fiatCode, tickerName)) {
    return getCurrencyRates(ticker, fiatCode, cryptoCode)
  }

  return getRate(RETRIES, fiatCode)
    .then(({ fxRate }) => {
      try {
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
    if (!ticker.has['fetchTicker']) {
      throw new Error('Ticker not available')
    }
    const symbol = buildMarket(fiatCode, cryptoCode, ticker.id)
    return ticker.fetchTicker(symbol)
      .then(res => ({
        rates: {
          ask: new BN(res.ask),
          bid: new BN(res.bid)
        }
      }))
  } catch (e) {
    return Promise.reject(e)
  }
}

module.exports = { ticker }
