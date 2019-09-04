const axios = require('axios')
const BN = require('../../../bn')

function ticker (account, fiatCode, cryptoCode) {
  return axios.get('https://bitpay.com/rates/' + cryptoCode + '/' + fiatCode)
    .then(r => {
      const data = r.data.data
      const price = BN(data.rate.toString())
      return {
        rates: {
          ask: price,
          bid: price
        }
      }
    })
}

module.exports = {
  ticker,
  name: 'BitPay'
}
