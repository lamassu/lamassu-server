const axios = require('axios')
const _ = require('lodash/fp')

const BN = require('../../../bn')
const common = require('../../common/quadrigacx')

exports.NAME = 'QuadrigaCX'
exports.SUPPORTED_MODULES = ['ticker']

function findCurrency (fxRates, fiatCode) {
  const rates = _.find(_.matchesProperty('code', fiatCode), fxRates)
  if (!rates || !rates.rate) throw new Error(`Unsupported currency: ${fiatCode}`)
  return BN(rates.rate.toString())
}

exports.ticker = function ticker (account, fiatCode, cryptoCode) {
  if (fiatCode === 'USD' && cryptoCode === 'BTC' || fiatCode === 'CAD') {
    return getCurrencyRates(fiatCode, cryptoCode)
  }

  return axios.get('https://bitpay.com/api/rates')
    .then(response => {
      const fxRates = response.data
      const cadRate = findCurrency(fxRates, 'CAD')
      const fxRate = findCurrency(fxRates, fiatCode).div(cadRate)

      return getCurrencyRates('CAD', cryptoCode)
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
      return common.request(`/ticker?book=${market}`, 'GET')
    })
    .then(r => ({
      rates: {
        ask: BN(r.ask),
        bid: BN(r.bid)
      }
    }))
}
