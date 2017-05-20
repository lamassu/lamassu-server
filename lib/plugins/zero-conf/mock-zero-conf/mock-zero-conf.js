module.exports = {authorize}

function authorize (account, toAddress, cryptoAtoms, cryptoCode) {
  return Promise.resolve()
  .then(() => {
    if (cryptoCode !== 'BTC') throw new Error('Unsupported crypto: ' + cryptoCode)

    const authorizedValue = 1e5 * 10
    return cryptoAtoms.lte(authorizedValue)
  })
}
