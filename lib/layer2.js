const configManager = require('./config-manager')
const ph = require('./plugin-helper')
const _ = require('lodash/fp')
const logger = require('./logger')

function fetch (settings, cryptoCode) {
  const plugin = configManager.cryptoScoped(cryptoCode, settings.config).layer2

  if (_.isEmpty(plugin) || plugin === 'no-layer2') return Promise.resolve()

  const layer2 = ph.load(ph.LAYER2, plugin)
  const account = settings.accounts[plugin]

  return Promise.resolve({layer2, account})
}

function newAddress (settings, info) {
  return fetch(settings, info.cryptoCode)
    .then(r => {
      if (!r) return
      return r.layer2.newAddress(r.account, info)
    })
}

function getStatus (settings, tx) {
  const toAddress = tx.layer2Address
  if (!toAddress) return Promise.resolve({status: 'notSeen'})

  return fetch(settings, tx.cryptoCode)
    .then(r => {
      if (!r) return {status: 'notSeen'}
      return r.layer2.getStatus(r.account, toAddress, tx.cryptoAtoms, tx.cryptoCode)
    })
}

function cryptoNetwork (settings, cryptoCode) {
  const plugin = configManager.cryptoScoped(cryptoCode, settings.config).layer2
  const layer2 = ph.load(ph.LAYER2, plugin)
  const account = settings.accounts[plugin]

  if (!layer2.cryptoNetwork) return Promise.resolve(false)
  return layer2.cryptoNetwork(account, cryptoCode)
}

function isLayer2Address (address) {
  return address.split(':').length >= 2
}

module.exports = {
  isLayer2Address,
  newAddress,
  getStatus,
  cryptoNetwork
}
