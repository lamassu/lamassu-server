const configManager = require('./config-manager')
const ph = require('./plugin-helper')
const wallet = require('./wallet')
const _ = require('lodash/fp')

const ZERO_CONF_EXPIRATION = 60000

function fetch (settings, cryptoCode) {
  const plugin = configManager.cryptoScoped(cryptoCode, settings.config).layer2

  if (_.isEmpty(plugin) || plugin === 'no-layer2') return Promise.resolve()

  const layer2 = ph.load(ph.LAYER2, plugin)
  const account = settings.accounts[plugin]

  return Promise.resolve({ layer2, account })
}

function newAddress (settings, info) {
  return Promise.all([
    fetch(settings, info.cryptoCode),
    wallet.newAddress(settings, info)
  ])
    .then(result => {
      const r = result[0]
      const walletAddress = result[1]

      if (!r) {
        return {
          toAddress: walletAddress,
          layer2Address: null
        }
      }

      return r.layer2.newAddress(r.account, info)
        .then(address => ({
          toAddress: walletAddress,
          layer2Address: address
        }))
    })
}

function mergeStatus (a, b) {
  if (!a) return b
  if (!b) return a

  return { status: mergeStatusMode(a.status, b.status) }
}

function mergeStatusMode (a, b) {
  const cleared = ['authorized', 'confirmed', 'instant']
  if (_.includes(a, cleared)) return a
  if (_.includes(b, cleared)) return b

  if (a === 'published') return a
  if (b === 'published') return b

  if (a === 'rejected') return a
  if (b === 'rejected') return b

  return 'notSeen'
}

function authorizeZeroConf (settings, tx, machineId) {
  const cryptoConfig = configManager.cryptoScoped(tx.cryptoCode, settings.config)
  const machineConfig = configManager.machineScoped(machineId, settings.config)
  const plugin = cryptoConfig.zeroConf
  const zeroConfLimit = machineConfig.zeroConfLimit

  if (!_.isObject(tx.fiat)) {
    return Promise.reject(new Error('tx.fiat is undefined!'))
  }

  if (plugin === 'no-zero-conf' || tx.fiat.gt(zeroConfLimit)) {
    return Promise.resolve(false)
  }

  if (plugin === 'all-zero-conf') return Promise.resolve(true)

  const zeroConf = ph.load(ph.ZERO_CONF, plugin)
  const account = settings.accounts[plugin]

  return zeroConf.authorize(account, tx.toAddress, tx.cryptoAtoms, tx.cryptoCode)
}

function getLayer2Status (settings, tx) {
  const toAddress = tx.layer2Address
  if (!toAddress) return Promise.resolve({ status: 'notSeen' })

  return fetch(settings, tx.cryptoCode)
    .then(r => {
      if (!r) return { status: 'notSeen' }
      return r.layer2.getStatus(r.account, toAddress, tx.cryptoAtoms, tx.cryptoCode)
    })
}

function getStatus (settings, tx, machineId) {
  const layer2StatusPromise = getLayer2Status(settings, tx)

  return Promise.all([
    wallet.getStatus(settings, tx),
    layer2StatusPromise
  ])
    .then(([walletStatus, layer2Status]) => {
      return mergeStatus(walletStatus, layer2Status)
    })
    .then((statusRec) => {
      if (statusRec.status === 'authorized') {
        return authorizeZeroConf(settings, tx, machineId)
          .then(isAuthorized => {
            const publishAge = Date.now() - tx.publishedAt

            const unauthorizedStatus = publishAge < ZERO_CONF_EXPIRATION
              ? 'published'
              : 'rejected'

            const status = isAuthorized ? 'authorized' : unauthorizedStatus

            return { status }
          })
      }

      return statusRec
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
