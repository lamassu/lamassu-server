const BN = require('../../../bn')

function ticker (account, fiatCode, cryptoCode) {
  return Promise.resolve({
    rates: {
      ask: BN(0.05),
      bid: BN(0.05)
    }
  })
}

module.exports = {
  ticker,
  name: 'Ducatus'
}
