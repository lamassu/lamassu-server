const BN = require('../../../bn')
const common = require('../common/bitstamp')

function ticker (account, fiatCode, cryptoCode) {
  return Promise.resolve()
  .then(() => {
    if (cryptoCode !== 'BTC') {
      throw new Error('Unsupported crypto: ' + cryptoCode)
    }
  })
  .then(() => {
    const market = common.buildMarket(fiatCode, cryptoCode)
    return common.request('/ticker/' + market, 'GET')
  })
  .then(r => ({
    rates: {
      ask: BN(r.ask),
      bid: BN(r.bid)
    }
  }))
}

module.exports = {
  ticker
}

