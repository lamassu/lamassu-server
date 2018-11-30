const configManager = require('./config-manager')
const ph = require('./plugin-helper')
const _ = require('lodash/fp')

class Layer2Composite {
  constructor (walletAdapter, layer2, layer2Account) {
    this.walletAdapter = walletAdapter
    this.layer2 = layer2
    this.layer2Account = layer2Account
  }

  newAddress (settings, info) {
    return Promise.all([
      this.layer2.newAddress(this.layer2Account, info),
      this.walletAdapter.newAddress(settings, info)
    ])
      .then(result => ({
        layer2Address: result[0],
        toAddress: result[1]
      }))
  }

  getStatus (settings, tx) {
    const layer2StatusPromise = this.getLayer2Status(settings, tx)

    return Promise.all([
      this.walletAdapter.getStatus(settings, tx),
      layer2StatusPromise
    ])
      .then(([walletStatus, layer2Status]) => {
        return mergeStatus(walletStatus, layer2Status)
      })
  }

  getLayer2Status (settings, tx) {
    const toAddress = tx.layer2Address
    if (!toAddress) return Promise.resolve({ status: 'notSeen' })

    return this.layer2.getStatus(this.layer2Account, toAddress, tx.cryptoAtoms, tx.cryptoCode)
  }

  balance () {
    return this.walletAdapter.balance.apply(this.walletAdapter, arguments)
  }

  sendCoins () {
    return this.walletAdapter.sendCoins.apply(this.walletAdapter, arguments)
  }

  newFunding () {
    return this.walletAdapter.newFunding.apply(this.walletAdapter, arguments)
  }

  sweep () {
    return this.walletAdapter.sweep.apply(this.walletAdapter, arguments)
  }

  isStrictAddress () {
    return this.walletAdapter.isStrictAddress.apply(this.walletAdapter, arguments)
  }

  get supportsHd () {
    return this.walletAdapter.supportsHd
  }
}

function fetchLayer2 (settings, cryptoCode) {
  const plugin = configManager.cryptoScoped(cryptoCode, settings.config).layer2

  if (_.isEmpty(plugin) || plugin === 'no-layer2') return Promise.resolve()

  const layer2 = ph.load(ph.LAYER2, plugin)
  const account = settings.accounts[plugin]

  return Promise.resolve({ layer2, account })
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
  cryptoNetwork,
  fetchLayer2,
  Layer2Composite
}
