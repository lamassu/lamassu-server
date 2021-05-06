const { COINS } = require('lamassu-coins')
const _ = require('lodash/fp')

const kraken = require('../exchange/kraken')
const bitstamp = require('../exchange/bitstamp')
const itbit = require('../exchange/itbit')
const binanceus = require('../exchange/binanceus')
const cex = require('../exchange/cex')
const ftx = require('../exchange/ftx')
const bitpay = require('../ticker/bitpay')
const { BTC, BCH, DASH, ETH, LTC, ZEC, USDT, XMR } = COINS

const ALL = {
  cex: cex,
  ftx: ftx,
  binanceus: binanceus,
  kraken: kraken,
  bitstamp: bitstamp,
  itbit: itbit,
  bitpay: bitpay,
  coinbase: {
    CRYPTO: [BTC, ETH, LTC, DASH, ZEC, BCH, USDT, XMR],
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

function isConfigValid (config, fields) {
  const values = _.map(it => _.get(it)(config))(fields)
  return _.every(it => it || it === 0)(values)
}

module.exports = { buildMarket, ALL, verifyFiatSupport, isConfigValid }
