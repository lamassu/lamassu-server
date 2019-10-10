const cardanoApi = require('./client')

const fs = require('fs')
const crypto = require('crypto')
const { promisify } = require('util')

const common = require('../../common');
const coinUtils = require('../../../coin-utils')
const options = require('../../../options')

const cryptoRec = coinUtils.getCryptoCurrency('ADA')
const configPath = coinUtils.configPath(cryptoRec)

function sha256(input) {
  return crypto
    .createHash('sha256')
    .update(input)
    .digest('base64')
}

async function getCardanoMnemonic() {
  return promisify(fs.readFile)(options.cardanoMnemonicPath, 'utf8')
    .then(text => text.trim())
    .then(mnemonicText => ({
      mnemonic: mnemonicText.split(/[ \r\n]+/),
      hash: sha256(mnemonicText)
    }))
}

async function getWalletConfiguration() {
  return promisify(fs.readFile)(configPath)
    .then(text => JSON.parse(text))
    .catch(() => ({}))
}

async function saveWalletConfiguration(configuration) {
  return common.writeFile(configPath, JSON.stringify(configuration));
}

async function createWalletFromMnemonic(mnemonic) {
  const walletId = await cardanoApi.newWallet(
    mnemonic,
    'Server Wallet',
    'restore'
  )
  const accountIndex = await cardanoApi.newAccount(walletId)

  return {
    walletId,
    accountIndex
  }
}

async function getOrCreateWalletCredentials() {
  let configuration = await getWalletConfiguration()
  const mnemonic = await getCardanoMnemonic()

  if (
    !configuration.mnemonicHash ||
    configuration.mnemonicHash !== mnemonic.hash
  ) {
    const wallet = await createWalletFromMnemonic(mnemonic.mnemonic)
    configuration = {
      ...wallet,
      mnemonicHash: mnemonic.hash
    }
    await saveWalletConfiguration(configuration)
  }

  if (!configuration.walletId || !configuration.accountIndex) {
    throw new Error('Malformed Cardano configuration')
  }

  return {
    walletId: configuration.walletId,
    index: configuration.accountIndex
  }
}

module.exports = {
  getOrCreateWalletCredentials
}
