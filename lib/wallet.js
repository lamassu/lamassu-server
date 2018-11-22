const _ = require('lodash/fp')
const mem = require('mem')
const hkdf = require('futoin-hkdf')

const configManager = require('./config-manager')
const pify = require('pify')
const fs = pify(require('fs'))

const mnemonicHelpers = require('./mnemonic-helpers')
const options = require('./options')
const ph = require('./plugin-helper')
const layer2 = require('./layer2')

const FETCH_INTERVAL = 5000
const INSUFFICIENT_FUNDS_CODE = 570
const INSUFFICIENT_FUNDS_NAME = 'InsufficientFunds'
const ZERO_CONF_EXPIRATION = 60000

function httpError (msg, code) {
  const err = new Error(msg)
  err.name = 'HTTPError'
  err.code = code || 500

  return err
}

function computeSeed (masterSeed) {
  return hkdf(masterSeed, 32, { salt: 'lamassu-server-salt', info: 'wallet-seed' }).toString('hex')
}

function fetchWallet (settings, cryptoCode) {
  return fs.readFile(options.mnemonicPath, 'utf8')
    .then(mnemonic => {
      const masterSeed = mnemonicHelpers.toEntropyBuffer(mnemonic)
      const plugin = configManager.cryptoScoped(cryptoCode, settings.config).wallet
      const wallet = ph.load(ph.WALLET, plugin)
      const rawAccount = settings.accounts[plugin]
      const account = _.set('seed', computeSeed(masterSeed), rawAccount)
      if (_.isFunction(wallet.run)) wallet.run(account)

      return { wallet, account }
    })
}

const lastBalance = {}

function _balance (settings, cryptoCode) {
  return fetchWallet(settings, cryptoCode)
    .then(r => r.wallet.balance(r.account, cryptoCode))
    .then(balance => ({ balance, timestamp: Date.now() }))
    .then(r => {
      lastBalance[cryptoCode] = r
      return r
    })
    .catch(err => {
      console.error(err)
      return lastBalance[cryptoCode]
    })
}

function sendCoins (settings, toAddress, cryptoAtoms, cryptoCode) {
  return fetchWallet(settings, cryptoCode)
    .then(r => {
      return r.wallet.sendCoins(r.account, toAddress, cryptoAtoms, cryptoCode)
        .then(res => {
          mem.clear(module.exports.balance)
          return res
        })
    })
    .catch(err => {
      if (err.name === INSUFFICIENT_FUNDS_NAME) {
        throw httpError(INSUFFICIENT_FUNDS_NAME, INSUFFICIENT_FUNDS_CODE)
      }

      throw err
    })
}

function newAddress (settings, info) {
  return fetchWallet(settings, info.cryptoCode)
    .then(r => r.wallet.newAddress(r.account, info))
}

function newFunding (settings, cryptoCode, address) {
  return fetchWallet(settings, cryptoCode)
    .then(r => {
      const wallet = r.wallet
      const account = r.account

      return wallet.newFunding(account, cryptoCode)
    })
}

function getStatus (settings, tx) {
  return fetchWallet(settings, tx.cryptoCode)
    .then(r => r.wallet.getStatus(r.account, tx.toAddress, tx.cryptoAtoms, tx.cryptoCode))
}

function sweep (settings, cryptoCode, hdIndex) {
  return fetchWallet(settings, cryptoCode)
    .then(r => r.wallet.sweep(r.account, cryptoCode, hdIndex))
}

function isHd (settings, cryptoCode) {
  return fetchWallet(settings, cryptoCode)
    .then(r => r.wallet.supportsHd)
}

function cryptoNetwork (settings, cryptoCode) {
  const plugin = configManager.cryptoScoped(cryptoCode, settings.config).wallet
  const wallet = ph.load(ph.WALLET, plugin)
  const account = settings.accounts[plugin]

  if (!wallet.cryptoNetwork) return Promise.resolve(false)
  return wallet.cryptoNetwork(account, cryptoCode)
}

function isStrictAddress (settings, cryptoCode, toAddress) {
  // Note: For now, only for wallets that specifically check for this.

  return fetchWallet(settings, cryptoCode)
    .then(r => {
      if (!r.wallet.isStrictAddress) return true
      return r.wallet.isStrictAddress(cryptoCode, toAddress)
    })
}

const balance = mem(_balance, {
  maxAge: FETCH_INTERVAL,
  cacheKey: (settings, cryptoCode) => cryptoCode
})

module.exports = {
  balance,
  sendCoins,
  newAddress,
  getStatus,
  isStrictAddress,
  sweep,
  isHd,
  newFunding,
  cryptoNetwork
}
