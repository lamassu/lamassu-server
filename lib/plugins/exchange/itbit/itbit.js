const common = require('../../common/itbit')
const coinUtils = require('../../../coin-utils')

exports.buy = function (account, cryptoAtoms, fiatCode, cryptoCode) {
  return trade('buy', account, cryptoAtoms, fiatCode, cryptoCode)
}

exports.sell = function (account, cryptoAtoms, fiatCode, cryptoCode) {
  return trade('sell', account, cryptoAtoms, fiatCode, cryptoCode)
}

function trade (type, account, cryptoAtoms, fiatCode, cryptoCode) {
  try {
    const instrument = common.buildMarket(fiatCode, cryptoCode)
    const cryptoAmount = coinUtils.toUnit(cryptoAtoms, cryptoCode)

    return calculatePrice(type, instrument, cryptoAmount)
      .then(price => {
        const args = {
          side: type,
          type: 'limit',
          currency: cryptoCode,
          amount: cryptoAmount.toFixed(4),
          price: price.toFixed(2),
          instrument: instrument
        }
        return common.authRequest(account, 'POST', '/wallets/' + account.walletId + '/orders', args)
      })
  } catch (e) {
    return Promise.reject(e)
  }
}

function calculatePrice (type, tickerSymbol, amount) {
  return common.request('GET', '/markets/' + tickerSymbol + '/order_book')
    .then(orderBook => {
      const book = type == 'buy' ? 'asks' : 'bids'
      let collected = 0.0
      for (const entry of orderBook[book]) {
        collected += parseFloat(entry[1])
        if (collected >= amount) return parseFloat(entry[0])
      }
      throw new Error('Insufficient market depth')
    })
}
