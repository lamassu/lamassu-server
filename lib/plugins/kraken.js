require('es6-promise').polyfill()
var axios = require('axios')
var _ = require('lodash')
var BigNumber = require('bignumber.js')
BigNumber.config({DECIMAL_PLACES: 30})

exports.NAME = 'Kraken'
exports.SUPPORTED_MODULES = ['ticker']

// var pluginConfig = {}

// https://bitpay.com/api/rates

exports.config = function config (localConfig) {
//  pluginConfig = localConfig
}

function findCurrency (fxRates, currency) {
  return new BigNumber(_.find(fxRates, function (r) { return r.code === currency }).rate)
}

exports.ticker = function ticker (currencies, cryptoCoin, callback) {
  return axios.get('https://bitpay.com/api/rates')
  .then(function (response) {
    var fxRates = response.data

    return axios.get('https://api.kraken.com/0/public/Ticker?pair=ETHUSD')
    .then(function (response2) {
      var usdRate = findCurrency(fxRates, 'USD')
      var rates = response2.data.result.XETHZUSD
      var res = {}
      var cryptoCoinFactor = new BigNumber(10).pow(cryptoCoin.unitScale)

      currencies.forEach(function (currency) {
        var fxRate = findCurrency(fxRates, currency).div(usdRate)
        res[currency] = {
          ask: fxRate.times(rates.a[0]).div(cryptoCoinFactor),
          bid: fxRate.times(rates.b[0]).div(cryptoCoinFactor)
        }
      })

      callback(null, res)
    })
  })
  .catch(callback)
}

exports.ticker(['USD', 'ILS', 'EUR'], {unitScale: 18}, function (err, res) {
  if (err) return console.log(err.stack)
  console.log(JSON.stringify(res, null, 2))
})
