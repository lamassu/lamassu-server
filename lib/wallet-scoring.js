const ph = require('./plugin-helper')
const _ = require('lodash/fp')
const argv = require('minimist')(process.argv.slice(2))

function loadWalletScoring (settings) {
  if (_.isNil(argv.mockScoring)) {
    throw new Error('No wallet scoring API set!')
  }
  const pluginCode = argv.mockScoring ? 'mock-scoring' : ''
  const plugin = ph.load(ph.WALLET_SCORING, pluginCode)
  const account = settings.accounts[pluginCode]

  return { plugin, account }
}

function rateWallet (settings, address) {
  return Promise.resolve()
    .then(() => {
      const { plugin, account } = loadWalletScoring(settings)

      return plugin.rateWallet(account, address)
    })
}

module.exports = {
  rateWallet
}
