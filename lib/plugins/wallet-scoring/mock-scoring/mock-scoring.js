const NAME = 'FakeScoring'

const { WALLET_SCORE_THRESHOLD } = require('../../../constants')

function rateWallet (account, cryptoCode, address) {
  const threshold = account.scoreThreshold
  return new Promise((resolve, _) => {
    setTimeout(() => {
      console.log('[WALLET-SCORING] DEBUG: Mock scoring rating wallet address %s', address)
      return Promise.resolve(2)
        .then(score => resolve({ address, score, isValid: score < threshold }))
    }, 100)
  })
}

function isValidWalletScore (account, score) {
  const threshold = account.scoreThreshold
  return new Promise((resolve, _) => {
    setTimeout(() => {
      return resolve(score < threshold)
    }, 100)
  })
}

function getTransactionHash (account, cryptoCode, receivingAddress) {
  return new Promise((resolve, _) => {
    setTimeout(() => {
      return resolve('<Fake transaction hash>')
    }, 100)
  })
}

function getInputAddresses (account, cryptoCode, txHashes) {
  return new Promise((resolve, _) => {
    setTimeout(() => {
      return resolve(['<Fake input address hash>'])
    }, 100)
  })
}

module.exports = {
  NAME,
  rateWallet,
  isValidWalletScore,
  getTransactionHash,
  getInputAddresses
}
