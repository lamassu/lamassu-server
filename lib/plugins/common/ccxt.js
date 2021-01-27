const _ = require('lodash/fp')

const kraken = require('../exchange/kraken')
const bitstamp = require('../exchange/bitstamp')
const itbit = require('../exchange/itbit')
const bitpay = require('../ticker/bitpay')
const { COINS } = require('../../new-admin/config/coins')
const { BTC, BCH, DASH, ETH, LTC, ZEC } = COINS

const ALL = {
  kraken: kraken,
  bitstamp: bitstamp,
  itbit: itbit,
  bitpay: bitpay,
  coinbase: {
    CRYPTO: [BTC, ETH, LTC, DASH, ZEC, BCH],
    FIAT: 'ALL_CURRENCIES'
  }
}

function buildMarket (fiatCode, cryptoCode, serviceName) {
  if (!_.includes(cryptoCode, ALL[serviceName].CRYPTO)) {
    throw new Error('Unsupported crypto: ' + cryptoCode)
  }
  const fiatSupported = ALL[serviceName].FIAT
  if (fiatSupported !== 'ALL_CURRENCIES' && !_.includes(fiatCode, fiatSupported)) {
    throw new Error('Unsupported fiat: ' + fiatCode)
  }
  return cryptoCode + '/' + fiatCode
}

function verifyFiatSupport (fiatCode, serviceName) {
  const fiat = ALL[serviceName].FIAT
  return fiat === 'ALL_CURRENCIES' ? true : _.includes(fiatCode, fiat)
}

module.exports = { buildMarket, ALL, verifyFiatSupport }
