const _ = require('lodash/fp')
const mem = require('mem')
const HKDF = require('node-hkdf-sync')

const configManager = require('./config-manager')
const pify = require('pify')
const fs = pify(require('fs'))
const options = require('./options')
const ph = require('./plugin-helper')
const db = require('./db')

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

function newFunding (settings, cryptoCode, address) {
  return fetchWallet(settings, cryptoCode)
  .then(r => {
    const wallet = r.wallet
    const account = r.account

    return wallet.newFunding(account, cryptoCode)
  })
}

function getWalletStatus (settings, tx) {
  return fetchWallet(settings, tx.cryptoCode)
  .then(r => r.wallet.getStatus(r.account, tx.toAddress, tx.cryptoAtoms, tx.cryptoCode))
}

function authorizeZeroConf (settings, tx, machineId) {
  const cryptoConfig = configManager.cryptoScoped(tx.cryptoCode, settings.config)
  const machineConfig = configManager.machineScoped(machineId, settings.config)
  const plugin = cryptoConfig.zeroConf
  const zeroConfLimit = machineConfig.zeroConfLimit

  if (tx.fiat.gt(zeroConfLimit)) return Promise.resolve(false)
  if (tx.cryptoCode !== 'BTC' || plugin === 'all-zero-conf') return Promise.resolve(true)

  const zeroConf = ph.load(ph.ZERO_CONF, plugin)
  const account = settings.accounts[plugin]

  return zeroConf.authorize(account, tx.toAddress, tx.cryptoAtoms, tx.cryptoCode)
}

function getPublishAge (txId) {
  const sql = `select extract(epoch from (now() - created)) * 1000 as age
  from cash_out_actions
  where tx_id=$1
  and action=$2`

  return db.oneOrNone(sql, [txId, 'published'])
  .then(row => row && row.age)
}

function getStatus (settings, tx, machineId) {
  const promises = [
    getWalletStatus(settings, tx),
    authorizeZeroConf(settings, tx, machineId),
    getPublishAge(tx.id)
  ]

  return Promise.all(promises)
  .then(([statusRec, isAuthorized, publishAge]) => {
    if (statusRec.status === 'authorized') {
      const unauthorizedStatus = publishAge < ZERO_CONF_EXPIRATION
      ? 'published'
      : 'rejected'

      return {status: (isAuthorized ? 'authorized' : unauthorizedStatus)}
    }

    return statusRec
  })
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

module.exports = {
  balance: mem(balance, {maxAge: FETCH_INTERVAL}),
  sendCoins,
  newAddress,
  getStatus,
  sweep,
  isHd,
  newFunding,
  cryptoNetwork
}
