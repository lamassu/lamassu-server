const BN = require('../../bn')

function ticker (fiatCode, cryptoCode) {
  return Promise.resolve({
    rates: {
      ask: new BN(105),
      bid: new BN(100)
    }
  })
}

module.exports = {ticker}
