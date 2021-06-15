const axios = require('axios')
const { COINS } = require('lamassu-coins')

const BN = require('../../bn')
const { BTC, BCH } = COINS

const CRYPTO = [BTC, BCH]
const FIAT = 'ALL_CURRENCIES'

function ticker (fiatCode, cryptoCode) {
  return axios.get('https://bitpay.com/rates/' + cryptoCode + '/' + fiatCode)
    .then(r => {
      const data = r.data.data
      const price = new BN(data.rate.toString())
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
