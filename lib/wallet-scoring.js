const ph = require('./plugin-helper')
const argv = require('minimist')(process.argv.slice(2))
const configManager = require('./new-config-manager')

function loadWalletScoring (settings, cryptoCode) {
  const pluginCode = argv.mockScoring ? 'mock-scoring' : 'scorechain'
  const wallet = cryptoCode ? ph.load(ph.WALLET, configManager.getWalletSettings(cryptoCode, settings.config).wallet) : null
  const plugin = ph.load(ph.WALLET_SCORING, pluginCode)
  const account = settings.accounts[pluginCode]

  return { plugin, account, wallet }
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
