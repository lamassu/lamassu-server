const mem = require('mem')
const configManager = require('./config-manager')

const FETCH_INTERVAL = 5000

function fetchWallet (settings, cryptoCode) {
  return Promise.resolve()
  .then(() => {
    const plugin = configManager.cryptoScoped(cryptoCode, settings.config).wallet
    const account = settings.accounts[plugin]
    const wallet = require('lamassu-' + plugin)

    return {wallet, account}
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
}

function newAddress (settings, cryptoCode, info) {
  return fetchWallet(settings, cryptoCode)
  .then(r => r.wallet.newAddress(r.account, cryptoCode, info))
}

function getStatus (settings, toAddress, cryptoAtoms, cryptoCode) {
  return fetchWallet(settings, cryptoCode)
  .then(r => r.wallet.getStatus(r.account, toAddress, cryptoAtoms, cryptoCode))
}

module.exports = {
  balance: mem(balance, {maxAge: FETCH_INTERVAL}),
  sendCoins,
  newAddress,
  getStatus
}
