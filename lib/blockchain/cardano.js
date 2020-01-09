const path = require('path')
const common = require('./common')
const mnemonicHelpers = require('../../lib/mnemonic-helpers')
const fs = require('fs')

const coinUtils = require('../coin-utils')
const options = require('../options')
const _ = require('lodash')

module.exports = { setup }

const es = common.es

function from24to12wordMnemonic(mnemonic) {
  const entropy = mnemonicHelpers.toEntropyBuffer(mnemonic).toString('hex')
  return mnemonicHelpers.fromSeed(entropy.substring(0, 32))
}

function setup(dataDir) {
  const coinSettings = coinUtils.getCryptoCurrency('ADA')

  common.firewall([coinSettings.defaultPort])

  const defaultConfigData = {
    walletId: null,
    index: null,
    mnemonicHash: null
  }
  common.writeFile(
    path.resolve(dataDir, coinSettings.configFile),
    JSON.stringify(defaultConfigData)
  )

  const mnemonic = fs.readFileSync(options.mnemonicPath, 'utf8')
  if (!mnemonic) {
    throw new Error('Missing mnemonic')
  }
  const cardanoMnemonic = from24to12wordMnemonic(mnemonic)
  common.writeFile(options.cardanoMnemonicPath, cardanoMnemonic)

  const cmd = `/usr/local/bin/${coinSettings.daemon} ${dataDir} ${coinSettings.defaultPort}`
  common.writeSupervisorConfig(coinSettings, cmd)
}
