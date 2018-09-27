const common = require('../../common/quadrigacx')
const coinUtils = require('../../../coin-utils')

function buy (account, cryptoAtoms, fiatCode, cryptoCode) {
  return trade('buy', account, cryptoAtoms, fiatCode, cryptoCode)
}

function sell (account, cryptoAtoms, fiatCode, cryptoCode) {
  return trade('sell', account, cryptoAtoms, fiatCode, cryptoCode)
}

function trade (type, account, cryptoAtoms, fiatCode, cryptoCode) {
  try {
    const market = common.buildMarket(fiatCode, cryptoCode)
    const options = {
      book: market,
      amount: coinUtils.toUnit(cryptoAtoms, cryptoCode).toFixed(8)
    }

    return common.authRequest(account, '/' + type, options)
  } catch (e) {
    return Promise.reject(e)
  }
}

module.exports = {
  buy,
  sell
}
