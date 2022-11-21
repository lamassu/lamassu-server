const { COINS } = require('@lamassu/coins')
const _ = require('lodash/fp')
const { utils: coinUtils } = require('@lamassu/coins')

const kraken = require('../exchange/kraken')
const bitstamp = require('../exchange/bitstamp')
const itbit = require('../exchange/itbit')
const binanceus = require('../exchange/binanceus')
const cex = require('../exchange/cex')
const ftx = require('../exchange/ftx')
const bitpay = require('../ticker/bitpay')
const binance = require('../exchange/binance')

const { BTC, BCH, DASH, ETH, LTC, ZEC, USDT, LN } = COINS

const ALL = {
  cex: cex,
  ftx: ftx,
  binanceus: binanceus,
  kraken: kraken,
  bitstamp: bitstamp,
  itbit: itbit,
  bitpay: bitpay,
  coinbase: {
    CRYPTO: [BTC, ETH, LTC, DASH, ZEC, BCH, USDT, LN],
    FIAT: 'ALL_CURRENCIES'
  },
  binance: binance
}

function buildMarket (fiatCode, cryptoCode, serviceName) {
  const externalCryptoCode = coinUtils.getExternalCryptoCode(cryptoCode)
  if (!_.includes(externalCryptoCode, ALL[serviceName].CRYPTO)) {
    throw new Error('Unsupported crypto: ' + externalCryptoCode)
  }

  if (_.isNil(fiatCode)) throw new Error('Market pair building failed: Missing fiat code')
  return externalCryptoCode + '/' + fiatCode
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
