const axios = require('axios')
const _ = require('lodash/fp')

const BN = require('../../../bn')
const common = require('../../common/bitstamp')

exports.NAME = 'Bitstamp'
exports.SUPPORTED_MODULES = ['ticker']

function findCurrency (fxRates, fiatCode) {
  const rates = _.find(_.matchesProperty('code', fiatCode), fxRates)
  if (!rates || !rates.rate) throw new Error(`Unsupported currency: ${fiatCode}`)
  return BN(rates.rate)
}

exports.ticker = function ticker (account, fiatCode, cryptoCode) {
  if (fiatCode === 'USD' || fiatCode === 'EUR') {
    return getCurrencyRates(fiatCode, cryptoCode)
  }

  return axios.get('https://bitpay.com/api/rates')
    .then(response => {
      const fxRates = response.data
      const usdRate = findCurrency(fxRates, 'USD')
      const fxRate = findCurrency(fxRates, fiatCode).div(usdRate)

      return getCurrencyRates('USD', cryptoCode)
        .then(res => ({
          rates: {
            ask: res.rates.ask.times(fxRate),
            bid: res.rates.bid.times(fxRate)
          }
        }))
    })
}

function getCurrencyRates (fiatCode, cryptoCode) {
  return Promise.resolve()
    .then(() => {
      const market = common.buildMarket(fiatCode, cryptoCode)
      return common.request('/ticker/' + market, 'GET')
    })
    .then(r => ({
      rates: {
        ask: BN(r.ask),
        bid: BN(r.bid)
      }
    }))
}
