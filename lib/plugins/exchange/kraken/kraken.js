// Note: Using DeX3/npm-kraken-api to adjust timeout time
const Kraken = require('kraken-api')
const _ = require('lodash/fp')

const common = require('../../common/kraken')
const coinUtils = require('../../../coin-utils')

var PAIRS = common.PAIRS

module.exports = {buy, sell}

function buy (account, cryptoAtoms, fiatCode, cryptoCode) {
  return trade(account, 'buy', cryptoAtoms, fiatCode, cryptoCode)
}

function sell (account, cryptoAtoms, fiatCode, cryptoCode) {
  return trade(account, 'sell', cryptoAtoms, fiatCode, cryptoCode)
}

function trade (account, type, cryptoAtoms, fiatCode, cryptoCode) {
  const kraken = new Kraken(account.apiKey, account.privateKey, {timeout: 30000})
  const amount = coinUtils.toUnit(cryptoAtoms, cryptoCode)
  const amountStr = amount.toFixed(6)

  const pair = _.includes(fiatCode, ['USD', 'EUR'])
    ? PAIRS[cryptoCode][fiatCode]
    : PAIRS[cryptoCode]['EUR']

  var orderInfo = {
    pair,
    type,
    ordertype: 'market',
    volume: amountStr,
    expiretm: '+60'
  }

  return new Promise((resolve, reject) => {
    kraken.api('AddOrder', orderInfo, (error, response) => {
      if (error) return reject(error)

      return resolve()
    })
  })
}
