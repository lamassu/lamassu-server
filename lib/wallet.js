const _ = require('lodash/fp')
const mem = require('mem')
const hkdf = require('futoin-hkdf')

const configManager = require('./new-config-manager')
const pify = require('pify')
const fs = pify(require('fs'))

const mnemonicHelpers = require('./mnemonic-helpers')
const options = require('./options')
const ph = require('./plugin-helper')
const layer2 = require('./layer2')
const httpError = require('./route-helpers').httpError
const logger = require('./logger')
const { getOpenBatchCryptoValue } = require('./tx-batching')
const BN = require('./bn')
const { BALANCE_FETCH_SPEED_MULTIPLIER } = require('./constants')

const FETCH_INTERVAL = 5000
const INSUFFICIENT_FUNDS_CODE = 570
const INSUFFICIENT_FUNDS_NAME = 'InsufficientFunds'
const ZERO_CONF_EXPIRATION = 60000

function computeSeed (masterSeed) {
  return hkdf(masterSeed, 32, { salt: 'lamassu-server-salt', info: 'wallet-seed' })
}

function computeOperatorId (masterSeed) {
  return hkdf(masterSeed, 16, { salt: 'lamassu-server-salt', info: 'operator-id' }).toString('hex')
}

function fetchWallet (settings, cryptoCode) {
  return fs.readFile(options.mnemonicPath, 'utf8')
    .then(mnemonic => {
      const masterSeed = mnemonicHelpers.toEntropyBuffer(mnemonic)
      const plugin = configManager.getWalletSettings(cryptoCode, settings.config).wallet
      const wallet = ph.load(ph.WALLET, plugin)
      const rawAccount = settings.accounts[plugin]
      const account = _.set('seed', computeSeed(masterSeed), rawAccount)
      if (_.isFunction(wallet.run)) wallet.run(account)
      const operatorId = computeOperatorId(masterSeed)
      return { wallet, account, operatorId }
    })
}

const lastBalance = {}

function _balance (settings, cryptoCode) {
  return fetchWallet(settings, cryptoCode)
    .then(r => r.wallet.balance(r.account, cryptoCode, settings, r.operatorId))
    .then(balance => Promise.all([balance, getOpenBatchCryptoValue(cryptoCode)]))
    .then(([balance, reservedBalance]) => ({ balance: BN(balance).minus(reservedBalance), reservedBalance, timestamp: Date.now() }))
    .then(r => {
      lastBalance[cryptoCode] = r
      return r
    })
    .catch(err => {
      logger.error(err)
      return lastBalance[cryptoCode]
    })
}

function sendCoins (settings, tx) {
  return fetchWallet(settings, tx.cryptoCode)
    .then(r => {
      const feeMultiplier = new BN(configManager.getWalletSettings(tx.cryptoCode, settings.config).feeMultiplier)
      return r.wallet.sendCoins(r.account, tx, settings, r.operatorId, feeMultiplier)
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

function sendCoinsBatch (settings, txs, cryptoCode) {
  return fetchWallet(settings, cryptoCode)
    .then(r => {
      const feeMultiplier = new BN(configManager.getWalletSettings(cryptoCode, settings.config).feeMultiplier)
      return r.wallet.sendCoinsBatch(r.account, txs, cryptoCode, feeMultiplier)
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

function newAddress (settings, info, tx) {
  const walletAddressPromise = fetchWallet(settings, info.cryptoCode)
    .then(r => r.wallet.newAddress(r.account, info, tx, settings, r.operatorId))

  return Promise.all([
    walletAddressPromise,
    layer2.newAddress(settings, info)
  ])
    .then(([toAddress, layer2Address]) => ({
      toAddress,
      layer2Address
    }))
}

function newFunding (settings, cryptoCode, address) {
  return fetchWallet(settings, cryptoCode)
    .then(r => {
      const wallet = r.wallet
      const account = r.account

      return wallet.newFunding(account, cryptoCode, settings, r.operatorId)
    })
}

function mergeStatus (a, b) {
  if (!a) return b
  if (!b) return a

  return { receivedCryptoAtoms: a.receivedCryptoAtoms, status: mergeStatusMode(a.status, b.status) }
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

function getWalletStatus (settings, tx) {
  const fudgeFactorEnabled = configManager.getGlobalCashOut(settings.config).fudgeFactorActive
  const fudgeFactor = fudgeFactorEnabled ? 100 : 0
  const requested = tx.cryptoAtoms.minus(fudgeFactor)

  const walletStatusPromise = fetchWallet(settings, tx.cryptoCode)
    .then(r => r.wallet.getStatus(r.account, tx, requested, settings, r.operatorId))

  return Promise.all([
    walletStatusPromise,
    layer2.getStatus(settings, tx)
  ])
    .then(([walletStatus, layer2Status]) => {
      return mergeStatus(walletStatus, layer2Status)
    })
}

function authorizeZeroConf (settings, tx, machineId) {
  const walletSettings = configManager.getWalletSettings(tx.cryptoCode, settings.config)
  const isBitcoindAvailable = walletSettings.wallet === 'bitcoind'
  const plugin = walletSettings.zeroConf
  const zeroConfLimit = walletSettings.zeroConfLimit || 0

  if (!_.isObject(tx.fiat)) {
    return Promise.reject(new Error('tx.fiat is undefined!'))
  }

  if (tx.fiat.gt(zeroConfLimit)) {
    return Promise.resolve(false)
  }

  if (plugin === 'none') return Promise.resolve(true)

  const zeroConf = ph.load(ph.ZERO_CONF, plugin)
  const account = settings.accounts[plugin]

  return zeroConf.authorize(account, tx.toAddress, tx.cryptoAtoms, tx.cryptoCode, isBitcoindAvailable)
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

            // Sanity check to confirm if there's any cryptoatoms for which to dispense bills
            const authorizedStatus = isAuthorized ? 'authorized' : unauthorizedStatus
            const status = BN(tx.cryptoAtoms).gt(0) ? authorizedStatus : 'rejected'

            return { receivedCryptoAtoms: statusRec.receivedCryptoAtoms, status }
          })
      }

      return statusRec
    })
}

function sweep (settings, cryptoCode, hdIndex) {
  return fetchWallet(settings, cryptoCode)
    .then(r => r.wallet.sweep(r.account, cryptoCode, hdIndex, settings, r.operatorId))
}

function isHd (settings, tx) {
  return fetchWallet(settings, tx.cryptoCode)
    .then(r => r.wallet.supportsHd)
}

function cryptoNetwork (settings, cryptoCode) {
  const plugin = configManager.getWalletSettings(cryptoCode, settings.config).wallet
  const account = settings.accounts[plugin]
  return fetchWallet(settings, cryptoCode).then(r => {
    if (!r.wallet.cryptoNetwork) return Promise.resolve(false)
    return r.wallet.cryptoNetwork(account, cryptoCode, settings, r.operatorId)
  })
}

function isStrictAddress (settings, cryptoCode, toAddress) {
  // Note: For now, only for wallets that specifically check for this.

  return fetchWallet(settings, cryptoCode)
    .then(r => {
      if (!r.wallet.isStrictAddress) return true
      return r.wallet.isStrictAddress(cryptoCode, toAddress, settings, r.operatorId)
    })
}

function supportsBatching (settings, cryptoCode) {
  return fetchWallet(settings, cryptoCode).then(r => {
    return Promise.resolve(!!r.wallet.SUPPORTS_BATCHING && !!configManager.getWalletSettings(cryptoCode, settings.config).allowTransactionBatching)
  })
}

function checkBlockchainStatus (settings, cryptoCode) {
  const walletDaemons = {
    BTC: './plugins/wallet/bitcoind/bitcoind.js',
    BCH: './plugins/wallet/bitcoincashd/bitcoincashd.js',
    DASH: './plugins/wallet/dashd/dashd.js',
    ETH: './plugins/wallet/geth/base.js',
    LTC: './plugins/wallet/litecoind/litecoind.js',
    XMR: './plugins/wallet/monerod/monerod.js',
    ZEC: './plugins/wallet/zcashd/zcashd.js'
  }

  return Promise.resolve(require(walletDaemons[cryptoCode]))
    .then(({ checkBlockchainStatus }) => checkBlockchainStatus(cryptoCode))
}

const balance = (settings, cryptoCode) => {
  return fetchWallet(settings, cryptoCode)
    .then(r => r.wallet.fetchSpeed ?? BALANCE_FETCH_SPEED_MULTIPLIER.NORMAL)
    .then(multiplier => {
      switch (multiplier) {
        case BALANCE_FETCH_SPEED_MULTIPLIER.NORMAL:
          return balanceNormal(settings, cryptoCode)
        case BALANCE_FETCH_SPEED_MULTIPLIER.SLOW:
          return balanceSlow(settings, cryptoCode)
        default:
          throw new Error()
      }
    })
}

const balanceNormal = mem(_balance, {
  maxAge: BALANCE_FETCH_SPEED_MULTIPLIER.NORMAL * FETCH_INTERVAL,
  cacheKey: (settings, cryptoCode) => cryptoCode
})

const balanceSlow = mem(_balance, {
  maxAge: BALANCE_FETCH_SPEED_MULTIPLIER.SLOW * FETCH_INTERVAL,
  cacheKey: (settings, cryptoCode) => cryptoCode
})

module.exports = {
  balance,
  sendCoins,
  sendCoinsBatch,
  newAddress,
  getStatus,
  isStrictAddress,
  sweep,
  isHd,
  newFunding,
  cryptoNetwork,
  supportsBatching,
  checkBlockchainStatus
}
