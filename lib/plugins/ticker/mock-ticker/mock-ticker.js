const BN = require('../../../bn')

function ticker (account, fiatCode, cryptoCode) {
  return Promise.resolve({
    rates: {
      ask: BN(20000),
      bid: BN(1000)
    }
  })
}

module.exports = {ticker}
