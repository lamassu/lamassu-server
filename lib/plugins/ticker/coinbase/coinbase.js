const _ = require('lodash/fp')
const axios = require('axios')

const BN = require('../../../bn')

function getBuyPrice (obj) {
  const currencyPair = obj.currencyPair

  return axios({
    method: 'get',
    url: `https://api.coinbase.com/v2/prices/${currencyPair}/buy`,
    headers: {'CB-Version': '2017-07-10'}
  })
    .then(r => r.data)
}

function getSellPrice (obj) {
  const currencyPair = obj.currencyPair

  return axios({
    method: 'get',
    url: `https://api.coinbase.com/v2/prices/${currencyPair}/sell`,
    headers: {'CB-Version': '2017-07-10'}
  })
    .then(r => r.data)
}

function ticker (account, fiatCode, cryptoCode) {
  return Promise.resolve()
    .then(() => {
      if (!_.includes(cryptoCode, ['BTC', 'ETH', 'LTC', 'BCH'])) {
        throw new Error('Unsupported crypto: ' + cryptoCode)
      }
    })
    .then(() => {
      const currencyPair = `${cryptoCode}-${fiatCode}`
      const promises = [
        getBuyPrice({currencyPair}),
        getSellPrice({currencyPair})
      ]

      return Promise.all(promises)
    })
    .then(([buyPrice, sellPrice]) => ({
      rates: {
        ask: BN(buyPrice.data.amount),
        bid: BN(sellPrice.data.amount)
      }
    }))
}

module.exports = {
  ticker
}
