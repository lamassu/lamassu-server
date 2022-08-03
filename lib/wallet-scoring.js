const ph = require('./plugin-helper')
const argv = require('minimist')(process.argv.slice(2))
const configManager = require('./new-config-manager')

function loadWalletScoring (settings, cryptoCode) {
  const pluginCode = argv.mockScoring ? 'mock-scoring' : 'ciphertrace'
  const wallet = cryptoCode ? ph.load(ph.WALLET, configManager.getWalletSettings(cryptoCode, settings.config).wallet) : null
  const plugin = ph.load(ph.WALLET_SCORING, pluginCode)
  const account = settings.accounts[pluginCode]

  return { plugin, account, wallet }
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

function getTransactionHash (settings, cryptoCode, receivingAddress) {
  return Promise.resolve()
    .then(() => {
      const { plugin, account, wallet } = loadWalletScoring(settings, cryptoCode)

      return plugin.getTransactionHash(account, cryptoCode, receivingAddress, wallet)
    })
}

function getInputAddresses (settings, cryptoCode, txHashes) {
  return Promise.resolve()
    .then(() => {
      const { plugin, account } = loadWalletScoring(settings)

      return plugin.getInputAddresses(account, cryptoCode, txHashes)
    })
}

module.exports = {
  rateWallet,
  isValidWalletScore,
  getTransactionHash,
  getInputAddresses
}
