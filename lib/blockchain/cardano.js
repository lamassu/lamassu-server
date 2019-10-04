const fs = require('fs')
const path = require('path')
const common = require('./common')
const mnemonicHelpers = require('../../lib/mnemonic-helpers')

const coinUtils = require('../coin-utils')
const options = require('../options')

module.exports = { setup }

const es = common.es

// todo: maybe add '#' as second parameter?
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\#]/g, '\\$&')
}

function setup(dataDir) {
  const coinRec = coinUtils.getCryptoCurrency('ADA')

  // todo: maybe use template tag for escaping?
  es(
    `sudo sed -i 's#state-wallet-testnet/#${escapeRegExp(
      dataDir
    )}/#g' /usr/local/bin/cardano-testnet-wallet`
  )

  common.firewall([coinRec.defaultPort])

  const config = buildConfig(null, null, null)
  common.writeFile(path.resolve(dataDir, coinRec.configFile), config)

  const seed = es('openssl rand -hex 16')
  const mnemonic = mnemonicHelpers.fromSeed(seed.trim())
  fs.writeFileSync(options.cardanoMnemonicPath, mnemonic)

  const cmd = `/usr/local/bin/${coinRec.daemon}`
  common.writeSupervisorConfig(coinRec, cmd)
}

function buildConfig(walletId, index, mnemonicHash) {
  return JSON.stringify({
    walletId,
    index,
    mnemonicHash
  })
}
