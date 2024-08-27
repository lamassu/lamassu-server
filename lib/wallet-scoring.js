const ph = require('./plugin-helper')
const argv = require('minimist')(process.argv.slice(2))

// TODO - This function should be rolled back after UI is created for this feature
function loadWalletScoring (settings) {
  if (argv.mockScoring) {
    const mock = ph.load(ph.WALLET_SCORING, 'mock-scoring')
    return { plugin: mock, account: {} }
  }

  const scorechainAccount = settings.accounts['scorechain']
  if (scorechainAccount?.enabled) {
    const scorechain = ph.load(ph.WALLET_SCORING, 'scorechain')
    return { plugin: scorechain, account: scorechainAccount}
  }

  const ellipticAccount = settings.accounts['elliptic']
  const elliptic = ph.load(ph.WALLET_SCORING, 'elliptic')

  return { plugin: elliptic, account: ellipticAccount }
}

function rateTransaction (settings, cryptoCode, address) {
  return Promise.resolve()
    .then(() => {
      const { plugin, account } = loadWalletScoring(settings)

      return plugin.rateAddress(account, cryptoCode, address)
    })
}

function rateAddress (settings, cryptoCode, address) {
  return Promise.resolve()
    .then(() => {
      const { plugin, account } = loadWalletScoring(settings)

      return plugin.rateAddress(account, cryptoCode, address)
    })
}

function isWalletScoringEnabled (settings, cryptoCode) {
  return Promise.resolve()
    .then(() => {
      const { plugin, account } = loadWalletScoring(settings)

      return plugin.isWalletScoringEnabled(account, cryptoCode)
    })
}

module.exports = {
  rateAddress,
  rateTransaction,
  isWalletScoringEnabled
}
