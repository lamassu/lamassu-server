module.exports = {
  buy,
  sell
}

function buy (account, cryptoAtoms, fiatCode, cryptoCode) {
  console.log('[mock] buying %s %s for %s', cryptoAtoms.toString(), cryptoCode, fiatCode)
  return Promise.resolve()
}

function sell (account, cryptoAtoms, fiatCode, cryptoCode) {
  console.log('[mock] selling %s %s for %s', cryptoAtoms.toString(), cryptoCode, fiatCode)
  return Promise.resolve()
}
