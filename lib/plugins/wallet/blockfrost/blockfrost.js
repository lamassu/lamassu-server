const _ = require('lodash/fp')
const { utils: coinUtils } = require('@lamassu/coins')
const BN = require('../../../bn')
const Blockfrost = require('@blockfrost/blockfrost-js')
const { toEntropyBuffer, fromSeed } = require('../../../mnemonic-helpers')
const CardanoWasm = require('@emurgo/cardano-serialization-lib-nodejs')
const helper = require('../helper')

const NAME = 'Blockfrost'
const SUPPORTED_COINS = ['ADA']
const UNIT = 'lovelace'
const GAP_LIMIT = 20
const EXTERNAL_CHAIN = 0
const INTERNAL_CHAIN = 1

const mnemonic = helper.readMnemonic()
const walletHash = helper.computeWalletHash(mnemonic)

function buildBlockfrost (account) {
  return new Blockfrost.BlockFrostAPI({
    projectId: account.projectId
  })
}

function getRootKey (account) {
  const masterSeed = account.seed
  if (!masterSeed) throw new Error('No master seed!')
  const entropy = toEntropyBuffer(fromSeed(masterSeed))
  return CardanoWasm.Bip32PrivateKey.from_bip39_entropy(
    entropy,
    Buffer.from('')
  )
}

function generateKeys (rootKey, index, type) {
  const accountKey = rootKey
    .derive(0x80000000 + 1852) // purpose
    .derive(0x80000000 + 1815) // coin type
    .derive(0x80000000 + 0) // account #0

  const utxoPubKey = accountKey
    .derive(type) // external = 0 or internal = 1
    .derive(index) // address_index
    .to_public()

  const stakeKey = accountKey
    .derive(2) // chimeric
    .derive(0) // account #0
    .to_public()

  return { utxoPubKey, stakeKey }
}

function getWalletAddresses (account, cryptoCode) {
  const rootKey = getRootKey(account)
  helper.freeAddressIndeces(cryptoCode, walletHash, ['internal', 'external'])
    .then(({ internal, external }) => {
      // wallets addresses with staking key
      const addresses = []
      for (let i = 0; i <= external + GAP_LIMIT; i++) {
        addresses.push(getBaseAddress(rootKey, external, EXTERNAL_CHAIN))
      }
      for (let i = 0; i <= internal + GAP_LIMIT; i++) {
        addresses.push(getBaseAddress(rootKey, internal, INTERNAL_CHAIN))
      }
      return addresses
    })
}

function getBaseAddress (rootKey, index, type) {
  const { utxoPubKey, stakeKey } = generateKeys(rootKey, index, type)
  return CardanoWasm.BaseAddress.new(
    CardanoWasm.NetworkInfo.testnet().network_id(),
    CardanoWasm.StakeCredential.from_keyhash(utxoPubKey.to_raw_key().hash()),
    CardanoWasm.StakeCredential.from_keyhash(stakeKey.to_raw_key().hash())
  ).to_address().to_bech32()
}

function fetchBalance (account, addresses) {
  // const API = buildBlockfrost(account)
  return addresses
  // return API.addresses(address).then(({ amount }) => new BN(_.head(_.filter(result => result.unit === UNIT)(amount)).quantity))
}

function balance (account, cryptoCode, settings, operatorId) {
  return checkCryptoCode(cryptoCode)
    .then(() => getWalletAddresses(account, cryptoCode))
    .then(addresses => fetchBalance(account, addresses))
}

function newAddress (account, info, tx, settings, operatorId) {
  return getWalletAddress(account)
}

function checkBlockchainStatus (cryptoCode, account) {
  return checkCryptoCode(cryptoCode)
    .then(() => buildBlockfrost(account).health())
    .then(isHealthy => isHealthy ? 'ready' : 'syncing')
}

function checkCryptoCode (cryptoCode) {
  if (!SUPPORTED_COINS.includes(cryptoCode)) {
    return Promise.reject(new Error('Unsupported crypto: ' + cryptoCode))
  }

  return Promise.resolve()
}

module.exports = {
  NAME,
  balance,
  // sendCoins,
  newAddress,
  // getStatus,
  // newFunding,
  checkBlockchainStatus
}
