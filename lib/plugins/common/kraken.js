var BigNumber = require('bignumber.js')

var TEN = new BigNumber(10)

var UNIT_SCALES = {
  BTC: 8,
  ETH: 18
}

function unitScale (cryptoCoin) {
  return UNIT_SCALES[cryptoCoin]
}

exports.toUnit = function toUnit (cryptoAtoms, cryptoCoin) {
  var scale = TEN.pow(unitScale(cryptoCoin))
  return cryptoAtoms.div(scale)
}
