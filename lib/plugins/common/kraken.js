const coinUtils = require('../../coin-utils')

const PAIRS = {
  BTC: {
    USD: 'XXBTZUSD',
    EUR: 'XXBTZEUR'
  },
  ETH: {
    USD: 'XETHZUSD',
    EUR: 'XETHZEUR'
  },
  ZEC: {
    USD: 'XZECZUSD',
    EUR: 'XZECZEUR'
  },
  LTC: {
    USD: 'XLTCZUSD',
    EUR: 'XLTCZEUR'
  },
  DASH: {
    USD: 'DASHUSD',
    EUR: 'DASHEUR'
  },
  BCH: {
    USD: 'BCHUSD',
    EUR: 'BCHEUR'
  }
}

module.exports = {PAIRS, toUnit}

function toUnit (cryptoAtoms, cryptoCode) {
  const cryptoRec = coinUtils.getCryptoCurrency(cryptoCode)
  const unitScale = cryptoRec.unitScale
  return cryptoAtoms.shift(-unitScale)
}
