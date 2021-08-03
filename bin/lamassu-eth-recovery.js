const hdkey = require('ethereumjs-wallet/hdkey')
const hkdf = require('futoin-hkdf')
const db = require('../lib/db')
const mnemonicHelpers = require('../lib/mnemonic-helpers')

const pify = require('pify')
const fs = pify(require('fs'))

const options = require('../lib/options')

const paymentPrefixPath = "m/44'/60'/0'/0'"
const defaultPrefixPath = "m/44'/60'/1'/0'"

const address = process.argv[2]

function run (address) {
  Promise.all([fetchMnemonic(), searchForHdIndex(address)])
    .then(([mnemonic, hdIndex]) => {
      if (!mnemonic || !hdIndex) {
        console.log(`Error while retrieving private key!`)
        return
      }
      console.log(`Private key: `, paymentHdNode(mnemonic).deriveChild(hdIndex).getWallet().getPrivateKeyString())
    })
}

function searchForHdIndex (address) {
  const sql = `SELECT hd_index FROM cash_out_txs WHERE to_address = $1`
  return db.oneOrNone(sql, [address])
}

function fetchMnemonic () {
  return fs.readFile(options.mnemonicPath, 'utf8')
    .then(mnemonic => computeSeed(mnemonic))
}

function computeSeed (seed) {
  const masterSeed = mnemonicHelpers.toEntropyBuffer(seed)
  return hkdf(masterSeed, 32, { salt: 'lamassu-server-salt', info: 'wallet-seed' })
}

function paymentHdNode (masterSeed) {
  if (!masterSeed) throw new Error('No master seed!')
  const key = hdkey.fromMasterSeed(masterSeed)
  return key.derivePath(paymentPrefixPath)
}

function defaultHdNode (masterSeed) {
  if (!masterSeed) throw new Error('No master seed!')
  const key = hdkey.fromMasterSeed(masterSeed)
  return key.derivePath(defaultPrefixPath)
}

run(address)
