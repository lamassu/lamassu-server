const ph = require('./plugin-helper')
const _ = require('lodash/fp')
const argv = require('minimist')(process.argv.slice(2))

function loadWalletScoring (settings) {
  const pluginCode = argv.mockScoring ? 'mock-scoring' : 'ciphertrace'
  const plugin = ph.load(ph.WALLET_SCORING, pluginCode)
  const account = settings.accounts[pluginCode]

  return { plugin, account }
}

function rateWallet (settings, cryptoCode, address) {
  return Promise.resolve()
    .then(() => {
      const { plugin, account } = loadWalletScoring(settings)

      return plugin.rateWallet(account, cryptoCode, address)
    })
}

function isValidWalletScore (settings, score) {
  return Promise.resolve()
    .then(() => {
      const { plugin, account } = loadWalletScoring(settings)

      return plugin.isValidWalletScore(account, score)
    })
}

module.exports = {
  rateWallet,
  isValidWalletScore
}
