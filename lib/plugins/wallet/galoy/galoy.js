const NAME = 'LN'
const SUPPORTED_COINS = ['LN']

function checkCryptoCode (cryptoCode) {
  if (!SUPPORTED_COINS.includes(cryptoCode)) {
    return Promise.reject(new Error('Unsupported crypto: ' + cryptoCode))
  }

  return Promise.resolve()
}

function getWallet () {
  // Create wallet instance
}

function sendCoins (account, tx, settings, operatorId) {
  // const { toAddress, cryptoAtoms, cryptoCode } = tx
  return {}
}

function balance (account, cryptoCode, settings, operatorId) {
  return checkCryptoCode(cryptoCode)
    .then(() => getWallet(account, cryptoCode))
}

function newAddress (account, info, tx, settings, operatorId) {
  return checkCryptoCode(info.cryptoCode)
}

function getStatus (account, tx, requested, settings, operatorId) {
  const { cryptoCode } = tx
  return checkCryptoCode(cryptoCode).then(() => {})
}

function newFunding (account, cryptoCode, settings, operatorId) {
  return checkCryptoCode(cryptoCode)
}

function cryptoNetwork (account, cryptoCode, settings, operatorId) {
  return checkCryptoCode(cryptoCode)
    .then(() => {})
}

function checkBlockchainStatus (cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => Promise.resolve('ready'))
}

module.exports = {
  NAME,
  balance,
  sendCoins,
  newAddress,
  getStatus,
  newFunding,
  cryptoNetwork,
  checkBlockchainStatus
}
