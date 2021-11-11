const NAME = 'FakeScoring'

function rateWallet (account, address) {
  return new Promise((resolve, _) => {
    setTimeout(() => {
      console.log('[WALLET-SCORING] DEBUG: Mock scoring rating wallet address %s', address)
      return resolve({ address, rating: 5 })
    }, 100)
  })
}

module.exports = {
  NAME,
  rateWallet
}
