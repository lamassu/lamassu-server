const BigNumber = require('bignumber.js')

const coinUtils = require('../../coin-utils')

const TEN = new BigNumber(10)

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
  }
}

module.exports = {PAIRS, toUnit}

function toUnit (cryptoAtoms, cryptoCoin) {
  var scale = TEN.pow(coinUtils.unitScale(cryptoCoin))
  return cryptoAtoms.div(scale)
}
