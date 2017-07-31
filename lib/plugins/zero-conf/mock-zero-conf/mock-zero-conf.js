module.exports = {authorize}

function authorize (account, toAddress, cryptoAtoms, cryptoCode) {
  return Promise.resolve()
  .then(() => {
    if (cryptoCode !== 'BTC') throw new Error('Unsupported crypto: ' + cryptoCode)

    const isAuthorized = true
    return isAuthorized
  })
}
