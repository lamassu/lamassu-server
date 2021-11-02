const _ = require('lodash/fp')
const axios = require('axios')
const BN = require('./bn')

const MAX_ROTATIONS = 5

const getFiatRates = () => axios.get('https://bitpay.com/api/rates').then(response => response.data)

const API_QUEUE = [
  { api: getBitPayFxRate, name: 'bitpay', fiatCodeProperty: 'code', rateProperty: 'rate' },
  { api: getCoinCapFxRate, name: 'coincap', fiatCodeProperty: 'symbol', rateProperty: 'rateUsd' }
]

function getBitPayFxRate (fiatCode, fiatCodeProperty, rateProperty) {
  return axios.get('https://bitpay.com/rates')
    .then(response => {
      const fxRates = response.data.data
      const usdRate = findCurrencyRates(fxRates, 'USD', fiatCodeProperty, rateProperty)
      const fxRate = findCurrencyRates(fxRates, fiatCode, fiatCodeProperty, rateProperty).div(usdRate)
      return {
        fxRate
      }
    })
}

function getCoinCapFxRate (fiatCode, fiatCodeProperty, rateProperty) {
  return axios.get('https://api.coincap.io/v2/rates')
    .then(response => {
      const fxRates = response.data.data
      const fxRate = findCurrencyRates(fxRates, fiatCode, fiatCodeProperty, rateProperty)
      return {
        fxRate
      }
    })
}

function findCurrencyRates (fxRates, fiatCode, fiatCodeProperty, rateProperty) {
  const rates = _.find(_.matchesProperty(fiatCodeProperty, fiatCode), fxRates)
  if (!rates || !rates[rateProperty]) throw new Error(`Unsupported currency: ${fiatCode}`)
  return new BN(rates[rateProperty].toString())
}

const getRate = (retries = 1, fiatCode) => {
  const selected = _.first(API_QUEUE).name
  const activeAPI = _.first(API_QUEUE).api
  const fiatCodeProperty = _.first(API_QUEUE).fiatCodeProperty
  const rateProperty = _.first(API_QUEUE).rateProperty

  if (!activeAPI) throw new Error(`FOREX api ${selected} does not exist.`)

  return activeAPI(fiatCode, fiatCodeProperty, rateProperty).then(res => res)
    .catch(() => {
      // Switch service
      const erroredService = API_QUEUE.shift()
      API_QUEUE.push(erroredService)
      if (retries >= MAX_ROTATIONS) throw new Error(`FOREX API error from ${erroredService.name}`)

      return getRate(++retries, fiatCode)
    })
}

module.exports = { getFiatRates, getRate }
