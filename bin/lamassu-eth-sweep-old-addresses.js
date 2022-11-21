require('../lib/environment-helper')

const hdkey = require('ethereumjs-wallet/hdkey')
const _ = require('lodash/fp')
const hkdf = require('futoin-hkdf')
const pify = require('pify')
const fs = pify(require('fs'))
const Web3 = require('web3')
const web3 = new Web3()

const db = require('../lib/db')
const configManager = require('../lib/new-config-manager')
const { loadLatest } = require('../lib/new-settings-loader')
const mnemonicHelpers = require('../lib/mnemonic-helpers')
const { sweep } = require('../lib/wallet')
const ph = require('../lib/plugin-helper')

const MNEMONIC_PATH = process.env.MNEMONIC_PATH

function fetchWallet (settings, cryptoCode) {
  return fs.readFile(MNEMONIC_PATH, 'utf8')
    .then(mnemonic => {
      const masterSeed = mnemonicHelpers.toEntropyBuffer(mnemonic)
      const plugin = configManager.getWalletSettings(cryptoCode, settings.config).wallet
      const wallet = ph.load(ph.WALLET, plugin)
      const rawAccount = settings.accounts[plugin]
      const account = _.set('seed', computeSeed(masterSeed), rawAccount)
      if (_.isFunction(wallet.run)) wallet.run(account)
      return { wallet, account }
    })
}

function computeSeed (masterSeed) {
  return hkdf(masterSeed, 32, { salt: 'lamassu-server-salt', info: 'wallet-seed' })
}

function paymentHdNode (account) {
  const masterSeed = account.seed
  if (!masterSeed) throw new Error('No master seed!')
  const key = hdkey.fromMasterSeed(masterSeed)
  return key.derivePath("m/44'/60'/0'/0'")
}

const getHdIndices = db => {
  const sql = `SELECT id, crypto_code, hd_index FROM cash_out_txs WHERE hd_index IS NOT NULL AND status IN ('confirmed', 'instant') AND crypto_code = 'ETH'`
  return db.any(sql)
}

const getCashoutAddresses = (settings, indices) => {
  return Promise.all(_.map(it => {
    return fetchWallet(settings, it.crypto_code)
      .then(({ wallet, account }) => Promise.all([wallet, paymentHdNode(account).deriveChild(it.hd_index).getWallet().getChecksumAddressString()]))
      .then(([wallet, address]) => Promise.all([address, wallet._balance(false, address, 'ETH')]))
      .then(([address, balance]) => ({ address, balance: balance.toNumber(), cryptoCode: it.crypto_code, index: it.hd_index, txId: it.id }))
  }, indices))
}

Promise.all([getHdIndices(db), loadLatest()])
  .then(([indices, settings]) => Promise.all([settings, getCashoutAddresses(settings, indices)]))
  .then(([settings, addresses]) => {
    console.log('Found these cash-out addresses for ETH:')
    console.log(addresses)

    return Promise.all(_.map(it => {
      // If the address only has dust in it, don't bother sweeping
      if (web3.utils.fromWei(it.balance.toString()) > 0.00001) {
        console.log(`Address ${it.address} found to have ${web3.utils.fromWei(it.balance.toString())} ETH in it. Sweeping...`)
        return sweep(settings, it.txId, it.cryptoCode, it.index)
      }

      console.log(`Address ${it.address} contains no significant balance (${web3.utils.fromWei(it.balance.toString())}). Skipping the sweep process...`)
      return Promise.resolve()
    }, addresses))
  })
  .then(() => console.log('Process finished!'))
