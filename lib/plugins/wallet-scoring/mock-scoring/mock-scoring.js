const NAME = 'FakeScoring'

const { WALLET_SCORE_THRESHOLD } = require('../../../constants')

function rateWallet (account, cryptoCode, address) {
  return new Promise((resolve, _) => {
    setTimeout(() => {
      console.log('[WALLET-SCORING] DEBUG: Mock scoring rating wallet address %s', address)
      return Promise.resolve(7)
        .then(score => resolve({ address, score, isValid: score < WALLET_SCORE_THRESHOLD }))
    }, 100)
  })
}

function isValidWalletScore (account, score) {
  return new Promise((resolve, _) => {
    setTimeout(() => {
      return resolve(score < WALLET_SCORE_THRESHOLD)
    }, 100)
  })
}

module.exports = {
  NAME,
  rateWallet,
  isValidWalletScore
}
