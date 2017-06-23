const Kraken = require('kraken-api')
const common = require('../common/kraken')

var PAIRS = common.PAIRS

module.exports = {buy, sell}

function buy (account, cryptoAtoms, fiatCode, cryptoCode) {
  return trade(account, 'buy', cryptoAtoms, fiatCode, cryptoCode)
}

function sell (account, cryptoAtoms, fiatCode, cryptoCode) {
  return trade(account, 'sell', cryptoAtoms, fiatCode, cryptoCode)
}

function trade (account, type, cryptoAtoms, fiatCode, cryptoCode) {
  const kraken = new Kraken(account.apiKey, account.privateKey)
  const amount = common.toUnit(cryptoAtoms, cryptoCode)

  if (amount.lte('0.01')) {
    const err = new Error('Order size too small')
    err.name = 'orderTooSmall'
    return Promise.reject(err)
  }

  const amountStr = amount.toFixed(6)
  const pair = PAIRS[cryptoCode][fiatCode]

  var orderInfo = {
    pair: pair,
    type: type,
    ordertype: 'market',
    volume: amountStr,
    expiretm: '+60'
  }

  kraken.api('AddOrder', orderInfo, function (error, response) {
    if (error) {
      // TODO: handle: EOrder:Order minimum not met (volume too low)
      return Promise.reject(error)
    } else {
      return Promise.resolve()
    }
  })
}
