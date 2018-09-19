const common = require('../../common/bitstamp')
const coinUtils = require('../../../coin-utils')

function buy (account, cryptoAtoms, fiatCode, cryptoCode) {
  return trade('buy', account, cryptoAtoms, fiatCode, cryptoCode)
}

function sell (account, cryptoAtoms, fiatCode, cryptoCode) {
  return trade('sell', account, cryptoAtoms, fiatCode, cryptoCode)
}

function handleErrors (data) {
  if (!data.reason || !data.reason.__all__) return data

  const err = new Error(data.reason.__all__[0])

  if (data.reason.__all__[0].indexOf('Minimum order size is') === 0) {
    err.name = 'orderTooSmall'
  }

  throw err
}

function trade (type, account, cryptoAtoms, _fiatCode, cryptoCode) {
  const fiatCode = _fiatCode === 'USD' ? 'USD' : 'EUR'

  try {
    const market = common.buildMarket(fiatCode, cryptoCode)
    const options = {amount: coinUtils.toUnit(cryptoAtoms, cryptoCode).toFixed(8)}

    return common.authRequest(account, '/' + type + '/market/' + market, options)
      .catch(e => {
        if (e.response) handleErrors(e.response.data)
        throw e
      })
      .then(handleErrors)
  } catch (e) {
    return Promise.reject(e)
  }
}

module.exports = {
  buy,
  sell
}
