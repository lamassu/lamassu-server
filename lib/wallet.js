const mem = require('mem')
const settingsLoader = require('./settings-loader')
const configManager = require('./config-manager')

const FETCH_INTERVAL = 5000

function fetchWallet (cryptoCode) {
  return settingsLoader.settings()
  .then(settings => {
    const plugin = configManager.cryptoScoped(cryptoCode, settings.config).cryptoServices.wallet
    const account = settings.accounts.plugin
    const wallet = require('lamassu-' + plugin)

    return {wallet, account}
  })
}

function balance (cryptoCode) {
  return fetchWallet(cryptoCode)
  .then(r => r.wallet.balance(r.account))
  .then(balance => ({balance, timestamp: Date.now()}))
}

function sendCoins (toAddress, cryptoAtoms, cryptoCode) {
  return fetchWallet(cryptoCode)
  .then(r => {
    return r.wallet.sendCoins(r.account, toAddress, cryptoAtoms, cryptoCode)
    .then(res => {
      mem.clear(module.exports.balance)
      return res
    })
  })
}

function newAddress (cryptoCode, info) {
  return fetchWallet(cryptoCode)
  .then(r => r.wallet.newAddress(r.account, cryptoCode, info))
}

function getStatus (toAdress, cryptoAtoms, cryptoCode) {
  return fetchWallet(cryptoCode)
  .then(r => r.wallet.getStatus(r.account, toAdress, cryptoAtoms, cryptoCode))
}

module.exports = {
  balance: mem(balance, {maxAge: FETCH_INTERVAL}),
  sendCoins,
  newAddress,
  getStatus
}
