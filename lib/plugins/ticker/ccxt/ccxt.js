const ccxt = require('ccxt')
const BN = require('../../../bn')
const axios = require('axios')
const _ = require('lodash/fp')
const common = require('../../common/ccxt')

function ticker (exchangeName, fiatCode, cryptoCode) {
  const exchange = new ccxt[exchangeName]()

  if (fiatCode === 'EUR' || fiatCode === 'USD' || exchange.id === 'coinbase') {
    return getCurrencyRates(exchange, fiatCode, cryptoCode)
  }

  return axios.get('https://bitpay.com/rates')
    .then(response => {
      try {
        const fxRates = response.data.data
        const usdRate = findCurrencyRates(fxRates, 'USD')
        const fxRate = findCurrencyRates(fxRates, fiatCode).div(usdRate)

        return getCurrencyRates(exchange, 'USD', cryptoCode)
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

function getCurrencyRates (exchange, fiatCode, cryptoCode) {
  try {
    if (exchange.has['fetchTicker']) {
      const symbol = common.verifyCurrencies(exchange.id, fiatCode, cryptoCode)
      return exchange.fetchTicker(symbol)
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
