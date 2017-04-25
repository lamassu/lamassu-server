const _ = require('lodash/fp')
const mem = require('mem')
const HKDF = require('node-hkdf-sync')

const configManager = require('./config-manager')
const pify = require('pify')
const fs = pify(require('fs'))
const options = require('./options')
const ph = require('./plugin-helper')

const FETCH_INTERVAL = 5000
const INSUFFICIENT_FUNDS_CODE = 570
const INSUFFICIENT_FUNDS_NAME = 'InsufficientFunds'

function httpError (msg, code) {
  const err = new Error(msg)
  err.name = 'HTTPError'
  err.code = code || 500

  return err
}

function computeSeed (masterSeed) {
  const hkdf = new HKDF('sha256', 'lamassu-server-salt', masterSeed)
  return hkdf.derive('wallet-seed', 32)
}

function fetchWallet (settings, cryptoCode) {
  return fs.readFile(options.seedPath, 'utf8')
  .then(hex => {
    const masterSeed = Buffer.from(hex.trim(), 'hex')
    const plugin = configManager.cryptoScoped(cryptoCode, settings.config).wallet
    const wallet = ph.load(ph.WALLET, plugin)
    const account = settings.accounts[plugin]

    return {wallet, account: _.set('seed', computeSeed(masterSeed), account)}
  })
}

function balance (settings, cryptoCode) {
  return fetchWallet(settings, cryptoCode)
  .then(r => r.wallet.balance(r.account, cryptoCode))
  .then(balance => ({balance, timestamp: Date.now()}))
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

function getStatus (settings, toAddress, cryptoAtoms, cryptoCode) {
  return fetchWallet(settings, cryptoCode)
  .then(r => r.wallet.getStatus(r.account, toAddress, cryptoAtoms, cryptoCode))
}

function sweep (settings, cryptoCode, hdIndex) {
  return fetchWallet(settings, cryptoCode)
  .then(r => r.wallet.sweep(r.account, cryptoCode, hdIndex))
}

function isHd (settings, cryptoCode) {
  return fetchWallet(settings, cryptoCode)
  .then(r => r.wallet.supportsHd)
}

module.exports = {
  balance: mem(balance, {maxAge: FETCH_INTERVAL}),
  sendCoins,
  newAddress,
  getStatus,
  sweep,
  isHd
}
