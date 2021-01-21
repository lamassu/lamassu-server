const _ = require('lodash/fp')

const CRYPTO = {
  bitstamp: ['BTC', 'ETH', 'LTC', 'BCH'],
  itbit: ['BTC', 'ETH', 'LTC', 'BCH'],
  kraken: ['BTC', 'ETH', 'LTC', 'DASH', 'ZEC', 'BCH'],
  coinbase: ['BTC', 'ETH', 'LTC', 'BCH', 'ZEC', 'DASH']
}

const FIAT = {
  bitstamp: ['USD', 'EUR'],
  itbit: ['USD'],
  kraken: ['USD', 'EUR']
}

function verifyCurrencies (exchangeName, fiatCode, cryptoCode) {
  if (!_.includes(cryptoCode, CRYPTO[exchangeName])) {
    throw new Error('Unsupported crypto: ' + cryptoCode)
  }
  if (exchangeName !== 'coinbase') {
    if (!_.includes(fiatCode, FIAT[exchangeName])) {
      throw new Error('Unsupported fiat: ' + fiatCode)
    }
  }
  return cryptoCode + '/' + fiatCode
}

module.exports = { verifyCurrencies, CRYPTO, FIAT }
