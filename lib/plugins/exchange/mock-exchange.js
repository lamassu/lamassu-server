module.exports = {
  buy,
  sell,
  getAccount
}

function getAccount () {
  return { currencyMarket: 'USD' }
}

function buy (cryptoAtoms, fiatCode, cryptoCode) {
  console.log('[mock] buying %s %s for %s', cryptoAtoms.toString(), cryptoCode, fiatCode)
  return Promise.resolve()
}

function sell (cryptoAtoms, fiatCode, cryptoCode) {
  console.log('[mock] selling %s %s for %s', cryptoAtoms.toString(), cryptoCode, fiatCode)
  return Promise.resolve()
}
