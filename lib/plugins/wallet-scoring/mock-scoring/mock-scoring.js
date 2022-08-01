/*
 * variables WALLET_SCORE_THRESHOLD and WALLET_SCORE may be changed for testing purposes
 */
const WALLET_SCORE_THRESHOLD = 9
const WALLET_SCORE = 2

const NAME = 'FakeScoring'

function rateWallet (account, cryptoCode, address) {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('[WALLET-SCORING] DEBUG: Mock scoring rating wallet address %s', address)
      return Promise.resolve(WALLET_SCORE)
        .then(score => resolve({ address, score, isValid: score < WALLET_SCORE_THRESHOLD }))
    }, 100)
  })
}

function isValidWalletScore (account, score) {
  return new Promise(resolve => {
    setTimeout(() => {
      return resolve(score < WALLET_SCORE_THRESHOLD)
    }, 100)
  })
}

function getTransactionHash (account, cryptoCode, receivingAddress) {
  return new Promise(resolve => {
    setTimeout(() => {
      return resolve('<Fake transaction hash>')
    }, 100)
  })
}

function getInputAddresses (account, cryptoCode, txHashes) {
  return new Promise(resolve => {
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
