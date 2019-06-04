const axios = require('axios')
const _ = require('lodash/fp')

const BN = require('../../../bn')
const common = require('../../common/kraken')

exports.NAME = 'Kraken'
exports.SUPPORTED_MODULES = ['ticker']

const PAIRS = common.PAIRS

function findCurrency (fxRates, fiatCode) {
  const rates = _.find(_.matchesProperty('code', fiatCode), fxRates)
  if (!rates || !rates.rate) throw new Error(`Unsupported currency: ${fiatCode}`)
  return BN(rates.rate.toString())
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
  const pair = PAIRS[cryptoCode][fiatCode]

  return axios.get('https://api.kraken.com/0/public/Ticker?pair=' + pair)
    .then(function (response) {
      const rates = response.data.result[pair]
      return {
        rates: {
          ask: BN(rates.a[0]),
          bid: BN(rates.b[0])
        }
      }
    })
}
