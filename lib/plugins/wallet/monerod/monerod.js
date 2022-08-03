const fs = require('fs')
const path = require('path')
const _ = require('lodash/fp')
const { COINS, utils } = require('@lamassu/coins')
const { default: PQueue } = require('p-queue')

const BN = require('../../../bn')
const E = require('../../../error')
const logger = require('../../../logger')
const options = require('../../../options')
const jsonRpc = require('../../common/json-rpc')

const BLOCKCHAIN_DIR = process.env.BLOCKCHAIN_DIR

const cryptoRec = utils.getCryptoCurrency(COINS.XMR)
const configPath = utils.configPath(cryptoRec, BLOCKCHAIN_DIR)
const walletDir = path.resolve(utils.cryptoDir(cryptoRec, BLOCKCHAIN_DIR), 'wallets')

const DIGEST_QUEUE = new PQueue({
  concurrency: 1,
  interval: 150,
})

function createDigestRequest (account = {}, method, params = []) {
  return DIGEST_QUEUE.add(() => jsonRpc.fetchDigest(account, method, params)
    .then(res => {
      const r = JSON.parse(res)
      if (r.error) throw r.error
      return r.result
    })
  )
}

function rpcConfig () {
  try {
    const config = jsonRpc.parseConf(configPath)
    return {
      username: config['rpc-login'].split(':')[0],
      password: config['rpc-login'].split(':')[1],
      port: cryptoRec.walletPort || cryptoRec.defaultPort
    }
  } catch (err) {
    logger.error('Wallet is currently not installed!')
    return {
      username: '',
      password: '',
      port: cryptoRec.walletPort || cryptoRec.defaultPort
    }
  }
}

function fetch (method, params) {
  return createDigestRequest(rpcConfig(), method, params)
}

function handleError (error, method) {
  switch(error.code) {
    case -13:
      {
        if (
          fs.existsSync(path.resolve(walletDir, 'Wallet')) &&
          fs.existsSync(path.resolve(walletDir, 'Wallet.keys'))
        ) {
          logger.debug('Found wallet! Opening wallet...')
          return openWallet()
        }
        logger.debug('Couldn\'t find wallet! Creating...')
        return createWallet()
      }
    case -21:
      throw new Error('Wallet already exists!')
    case -22:
      try {
        return openWalletWithPassword()
      } catch {
        throw new Error('Invalid wallet password!')
      }
    case -17:
      throw new E.InsufficientFundsError()
    case -37:
      throw new E.InsufficientFundsError()
    default:
      throw new Error(
        _.join(' ', [
          `json-rpc::${method} error:`,
          JSON.stringify(_.get('message', error, '')),
          JSON.stringify(_.get('response.data.error', error, ''))
        ])
      )
  }
}

function openWallet () {
  return fetch('open_wallet', { filename: 'Wallet' })
    .catch(() => openWalletWithPassword())
}

function openWalletWithPassword () {
  return fetch('open_wallet', { filename: 'Wallet', password: rpcConfig().password })
}

function createWallet () {
  return fetch('create_wallet', { filename: 'Wallet', language: 'English' })
    .then(() => new Promise(() => setTimeout(() => openWallet(), 3000)))
    .then(() => fetch('auto_refresh'))
}

function checkCryptoCode (cryptoCode) {
  if (cryptoCode !== 'XMR') return Promise.reject(new Error('Unsupported crypto: ' + cryptoCode))
  return Promise.resolve()
}

function refreshWallet () {
  return fetch('refresh')
    .catch(err => handleError(err, 'refreshWallet'))
}

function accountBalance (cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => refreshWallet())
    .then(() => fetch('get_balance', { account_index: 0, address_indices: [0] }))
    .then(res => {
      return BN(res.unlocked_balance).decimalPlaces(0)
    })
    .catch(err => handleError(err, 'accountBalance'))
}

function balance (account, cryptoCode, settings, operatorId) {
  return accountBalance(cryptoCode)
}

function sendCoins (account, tx, settings, operatorId, feeMultiplier) {
  const { toAddress, cryptoAtoms, cryptoCode } = tx
  return checkCryptoCode(cryptoCode)
    .then(() => refreshWallet())
    .then(() => fetch('transfer_split', {
        destinations: [{ amount: cryptoAtoms, address: toAddress }],
        account_index: 0,
        subaddr_indices: [],
        priority: 0,
        mixin: 6,
        ring_size: 7,
        unlock_time: 0,
        get_tx_hex: false,
        new_algorithm: false,
        get_tx_metadata: false
      }))
    .then(res => ({
      fee: BN(res.fee_list[0]).abs(),
      txid: res.tx_hash_list[0]
    }))
    .catch(err => handleError(err, 'sendCoins'))
}

function newAddress (account, info, tx, settings, operatorId) {
  return checkCryptoCode(info.cryptoCode)
    .then(() => fetch('create_address', { account_index: 0 }))
    .then(res => res.address)
    .catch(err => handleError(err, 'newAddress'))
}

function getStatus (account, tx, requested, settings, operatorId) {
  const { toAddress, cryptoCode } = tx
  return checkCryptoCode(cryptoCode)
    .then(() => refreshWallet())
    .then(() => fetch('get_address_index', { address: toAddress }))
    .then(addressRes => fetch('get_transfers', { in: true, pool: true, account_index: addressRes.index.major, subaddr_indices: [addressRes.index.minor] }))
    .then(transferRes => {
      const confirmedToAddress = _.filter(it => it.address === toAddress, transferRes.in ?? [])
      const pendingToAddress = _.filter(it => it.address === toAddress, transferRes.pool ?? [])
      const confirmed = _.reduce((acc, value) => acc.plus(value.amount), BN(0), confirmedToAddress)
      const pending = _.reduce((acc, value) => acc.plus(value.amount), BN(0), pendingToAddress)

      if (confirmed.gte(requested)) return { receivedCryptoAtoms: confirmed, status: 'confirmed' }
      if (pending.gte(requested)) return { receivedCryptoAtoms: pending, status: 'authorized' }
      if (pending.gt(0)) return { receivedCryptoAtoms: pending, status: 'insufficientFunds' }
      return { receivedCryptoAtoms: pending, status: 'notSeen' }
    })
    .catch(err => handleError(err, 'getStatus'))
}

function newFunding (account, cryptoCode, settings, operatorId) {
  return checkCryptoCode(cryptoCode)
    .then(() => refreshWallet())
    .then(() => Promise.all([
      fetch('get_balance', { account_index: 0, address_indices: [0] }),
      fetch('create_address', { account_index: 0 }),
      fetch('get_transfers', { pool: true, account_index: 0 })
    ]))
    .then(([balanceRes, addressRes, transferRes]) => {
      const memPoolBalance = _.reduce((acc, value) => acc.plus(value.amount), BN(0), transferRes.pool)
      return {
        fundingPendingBalance: BN(balanceRes.balance).minus(balanceRes.unlocked_balance).plus(memPoolBalance),
        fundingConfirmedBalance: BN(balanceRes.unlocked_balance),
        fundingAddress: addressRes.address
      }
    })
    .catch(err => handleError(err, 'newFunding'))
}

function cryptoNetwork (account, cryptoCode, settings, operatorId) {
  return checkCryptoCode(cryptoCode)
    .then(() => {
      switch(parseInt(rpcConfig().port, 10)) {
        case 18082:
          return 'main'
        case 28082:
          return 'test'
        case 38083:
          return 'stage'
        default:
          return ''
      }
    })
}

function checkBlockchainStatus (cryptoCode) {
  return checkCryptoCode(cryptoCode)
  .then(() => {
    try {
      const config = jsonRpc.parseConf(configPath)
  
      // Daemon uses a different connection of the wallet
      const rpcConfig = {
        username: config['rpc-login'].split(':')[0],
        password: config['rpc-login'].split(':')[1],
        port: cryptoRec.defaultPort
      }
  
      return jsonRpc.fetchDigest(rpcConfig, 'get_info')
        .then(res => !!res.synchronized ? 'ready' : 'syncing')
    } catch (err) {
      throw new Error('XMR daemon is currently not installed')
    }
  })
}

function getTxHashesByAddress (cryptoCode, address) {
  checkCryptoCode(cryptoCode)
    .then(() => refreshWallet())
    .then(() => fetch('get_address_index', { address: address }))
    .then(addressRes => fetch('get_transfers', { in: true, pool: true, pending: true, account_index: addressRes.index.major, subaddr_indices: [addressRes.index.minor] }))
    .then(_.map(({ txid }) => txid))
}

module.exports = {
  balance,
  sendCoins,
  newAddress,
  getStatus,
  newFunding,
  cryptoNetwork,
  checkBlockchainStatus,
  getTxHashesByAddress
}
