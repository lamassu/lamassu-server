const axios = require('axios')

const BN = require('../../bn')
const { COINS } = require('../../new-admin/config/coins')
const { BTC, BCH } = COINS

const CRYPTO = [BTC, BCH]
const FIAT = 'ALL_CURRENCIES'

function ticker (fiatCode, cryptoCode) {
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
  name: 'BitPay',
  CRYPTO,
  FIAT
}
