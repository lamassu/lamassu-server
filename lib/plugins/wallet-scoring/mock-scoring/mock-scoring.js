const NAME = 'FakeScoring'

const { WALLET_SCORE_THRESHOLD } = require('../../../constants')

function rateAddress (account, cryptoCode, address) {
  return new Promise((resolve, _) => {
    setTimeout(() => {
      console.log('[WALLET-SCORING] DEBUG: Mock scoring rating wallet address %s', address)
      return Promise.resolve(2)
        .then(score => resolve({ address, score, isValid: score < WALLET_SCORE_THRESHOLD }))
    }, 100)
  })
}

function isWalletScoringEnabled (account, cryptoCode) {
  return new Promise((resolve, _) => {
    setTimeout(() => {
      return resolve(true)
    }, 100)
  })
}

module.exports = {
  NAME,
  rateAddress,
  rateTransaction:rateAddress,
  isWalletScoringEnabled
}
