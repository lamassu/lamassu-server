module.exports = {authorize}

function authorize (account, toAddress, cryptoAtoms, cryptoCode) {
  return Promise.resolve()
  .then(() => {
    if (cryptoCode !== 'BTC') throw new Error('Unsupported crypto: ' + cryptoCode)

    const authorizedValue = 1e5 * 2
    console.log('DEBUG300: %j', cryptoAtoms.lte(authorizedValue))
    return cryptoAtoms.lte(authorizedValue)
  })
}
