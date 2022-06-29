const _ = require('lodash/fp')
const { utils: coinUtils } = require('@lamassu/coins')
const BN = require('../../../bn')
const Blockfrost = require('@blockfrost/blockfrost-js')
const { toEntropyBuffer, fromSeed } = require('../../../mnemonic-helpers')
const CardanoWasm = require('@emurgo/cardano-serialization-lib-nodejs')

const NAME = 'Blockfrost'
const SUPPORTED_COINS = ['ADA']
const UNIT = 'lovelace'

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

function generateKeys (rootKey) {
  const accountKey = rootKey
    .derive(0x80000000 + 1852) // purpose
    .derive(0x80000000 + 1815) // coin type
    .derive(0x80000000 + 0) // account #0

  const utxoPubKey = accountKey
    .derive(0) // external
    .derive(0)
    .to_public()

  const stakeKey = accountKey
    .derive(2) // chimeric
    .derive(0)
    .to_public()

  return { utxoPubKey, stakeKey }
}

console.log(generateKeys(getRootKey(account)))

function getWalletAddress (account) {
  const keys = generateKeys(getRootKey(account))
  // base address with staking key
  const addr = CardanoWasm.BaseAddress.new(
    CardanoWasm.NetworkInfo.testnet().network_id(),
    CardanoWasm.StakeCredential.from_keyhash(keys.utxoPubKey.to_raw_key().hash()),
    CardanoWasm.StakeCredential.from_keyhash(keys.stakeKey.to_raw_key().hash())
  ).to_address().to_bech32()
  console.log(addr)
  return addr
}

function fetchBalance (account, address) {
  const API = buildBlockfrost(account)
  return API.addresses(address).then(({ amount }) => new BN(_.head(_.filter(result => result.unit === UNIT)(amount)).quantity))
}

function checkCryptoCode (cryptoCode) {
  if (!SUPPORTED_COINS.includes(cryptoCode)) {
    return Promise.reject(new Error('Unsupported crypto: ' + cryptoCode))
  }

  return Promise.resolve()
}

function newAddress (account, info, tx, settings, operatorId) {
  return getWalletAddress(account)
}

function balance (account, cryptoCode, settings, operatorId) {
  return checkCryptoCode(cryptoCode)
    .then(() => getWalletAddress(account))
    .then(address => fetchBalance(account, address))
}

function checkBlockchainStatus (cryptoCode, account) {
  return checkCryptoCode(cryptoCode)
    .then(() => buildBlockfrost(account).health())
    .then(isHealthy => isHealthy ? 'ready' : 'syncing')
}

// balance(account, 'ADA')
//   .then(r => console.log(r, 'OAWIJDPOAWIDJPAWOIDJA'))
//   .catch(err => {
//     console.error(err)
//   })

module.exports = {
  NAME,
  balance,
  // sendCoins,
  newAddress,
  // getStatus,
  // newFunding,
  checkBlockchainStatus
}
