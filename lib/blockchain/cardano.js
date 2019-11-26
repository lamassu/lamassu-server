const path = require('path')
const common = require('./common')
const mnemonicHelpers = require('../../lib/mnemonic-helpers')

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

  // original Cardano node script suppose to have DB and other things in
  // in `state-wallet-testnet` folder (relative to him), but we wanna to use
  // Lamassu recommended path defined in `dataDir` variable
  es(
    `sudo sed -i 's#state-wallet-testnet/#${_.escapeRegExp(dataDir).replace(
      /#/g,
      '\\#'
    )}/#g' /usr/local/bin/${coinSettings.daemon}`
  )

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
  common.writeFile(options.cardanoMnemonicPath, cardanoMnemonic) // todo musi se to pridat do nejakeho vychoziho soubour

  const cmd = `/usr/local/bin/${coinSettings.daemon}`
  common.writeSupervisorConfig(coinSettings, cmd)
}
