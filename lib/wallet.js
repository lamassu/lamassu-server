const mem = require('mem')
const configManager = require('./config-manager')

const FETCH_INTERVAL = 5000

function fetchWallet (settings, cryptoCode) {
  return Promise.resolve()
  .then(() => {
    console.log('DEBUG44')
    console.log('DEBUG44.0.0: %j', cryptoCode)
    try {
      console.log('DEBUG44.0: %j', configManager.cryptoScoped(cryptoCode, settings.config).wallet)
    } catch (err) {
      console.log('DEBUG44.0.e: %s', err.stack)
    }
    const plugin = configManager.cryptoScoped(cryptoCode, settings.config).wallet
    console.log('DEBUG44.1')
    const account = settings.accounts[plugin]
    console.log('DEBUG44.2')
    const wallet = require('lamassu-' + plugin)

    console.log('DEBUG45: %j', {wallet, account})

    return {wallet, account}
  })
}

function balance (settings, cryptoCode) {
  return fetchWallet(settings, cryptoCode)
  .then(r => r.wallet.balance(r.account, cryptoCode))
  .then(balance => ({balance, timestamp: Date.now()}))
}

function sendCoins (settings, toAddress, cryptoAtoms, cryptoCode) {
  console.log('DEBUG40')
  return fetchWallet(settings, cryptoCode)
  .then(r => {
    console.log('DEBUG41')
    return r.wallet.sendCoins(r.account, toAddress, cryptoAtoms, cryptoCode)
    .then(res => {
      console.log('DEBUG42')
      mem.clear(module.exports.balance)
      console.log('DEBUG43: %j', res)
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
