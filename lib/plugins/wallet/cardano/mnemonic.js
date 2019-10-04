const fs = require('fs')
const cardanoApi = require('./api')
const {sha256} = require('js-sha256')

const coinUtils = require('../../../coin-utils')
const options = require('../../../options')

const cryptoRec = coinUtils.getCryptoCurrency('ADA')
const configPath = coinUtils.configPath(cryptoRec)

function getCardanoMnemonic() {
  return fs
    .readFileSync(options.cardanoMnemonicPath, 'utf8')
    .trim()
    .split(/[ \r\n]+/)
}

function getCardanoMnemonicHashed() {
  return sha256(getCardanoMnemonic().join(' '))
}

function getWalletConfiguration() {
  return JSON.parse(fs.readFileSync(configPath))
}

function saveWalletConfiguration(configuration) {
  fs.writeFileSync(configPath, JSON.stringify(configuration))
}

async function walletId() {
  let configuration = getWalletConfiguration()

  if (
    !configuration.mnemonicHash ||
    configuration.mnemonicHash !== getCardanoMnemonicHashed()
  ) {
    // create new wallet from mnemonic
    const mnemonic = getCardanoMnemonic()

    const walletId = await cardanoApi.newWallet(mnemonic)
    const accountIndex = await cardanoApi.newAccount(walletId)

    configuration = {
      walletId,
      accountIndex,
      mnemonicHash: getCardanoMnemonicHashed()
    }

    saveWalletConfiguration(configuration)
  }

  if (!configuration.walletId || !configuration.accountIndex) {
    throw new Error('Malformed Cardano configuration')
  }

  return Promise.resolve({
    walletId: configuration.walletId,
    index: configuration.accountIndex
  })
}

module.exports = {
  walletId
}
