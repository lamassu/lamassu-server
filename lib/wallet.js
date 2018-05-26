const _ = require('lodash/fp')
const mem = require('mem')
const HKDF = require('node-hkdf-sync')

const configManager = require('./config-manager')
const pify = require('pify')
const fs = pify(require('fs'))

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

function isLayer2 (tx) {
  return _.isNil(tx.isLightning)
    ? layer2.isLayer2Address(tx.toAddress)
    : tx.isLightning
}

const lastBalance = {}

function _balance (settings, cryptoCode) {
  return fetchWallet(settings, cryptoCode)
    .then(r => r.wallet.balance(r.account, cryptoCode))
    .then(balance => ({balance, timestamp: Date.now()}))
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
  if (isLayer2(info)) return layer2.newAddress(settings, info)

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
  if (isLayer2(tx)) return layer2.getStatus(settings, tx)

  return fetchWallet(settings, tx.cryptoCode)
    .then(r => r.wallet.getStatus(r.account, tx.toAddress, tx.cryptoAtoms, tx.cryptoCode))
}

function authorizeZeroConf (settings, tx, machineId) {
  const cryptoConfig = configManager.cryptoScoped(tx.cryptoCode, settings.config)
  const machineConfig = configManager.machineScoped(machineId, settings.config)
  const plugin = cryptoConfig.zeroConf
  const zeroConfLimit = machineConfig.zeroConfLimit

  if (plugin === 'no-zero-conf' || tx.fiat.gt(zeroConfLimit)) {
    return Promise.resolve(false)
  }

  if (plugin === 'all-zero-conf') return Promise.resolve(true)

  const zeroConf = ph.load(ph.ZERO_CONF, plugin)
  const account = settings.accounts[plugin]

  return zeroConf.authorize(account, tx.toAddress, tx.cryptoAtoms, tx.cryptoCode)
}

function getStatus (settings, tx, machineId) {
  return getWalletStatus(settings, tx)
    .then((statusRec) => {
      if (statusRec.status === 'authorized') {
        return authorizeZeroConf(settings, tx, machineId)
          .then(isAuthorized => {
            const publishAge = Date.now() - tx.publishedAt

            const unauthorizedStatus = publishAge < ZERO_CONF_EXPIRATION
              ? 'published'
              : 'rejected'

            const status = isAuthorized ? 'authorized' : unauthorizedStatus

            return {status}
          })
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
