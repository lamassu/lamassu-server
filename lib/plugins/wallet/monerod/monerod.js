const fs = require('fs')
const path = require('path')
const _ = require('lodash/fp')
const jsonRpc = require('../../common/json-rpc')

const { utils } = require('lamassu-coins')

const blockchainUtils = require('../../../coin-utils')
const BN = require('../../../bn')
const E = require('../../../error')
const { logger } = require('../../../blockchain/common')

const cryptoRec = utils.getCryptoCurrency('XMR')
const configPath = utils.configPath(cryptoRec, blockchainUtils.blockchainDir())
const walletDir = path.resolve(utils.cryptoDir(cryptoRec, blockchainUtils.blockchainDir()), 'wallets')
const unitScale = cryptoRec.unitScale
const config = jsonRpc.parseConf(configPath)

const rpcConfig = {
  username: config['rpc-login'].split(':')[0],
  password: config['rpc-login'].split(':')[1],
  port: cryptoRec.walletPort || cryptoRec.defaultPort
}

function fetch (method, params) {
  return jsonRpc.fetchDigest(rpcConfig, method, params)
}

function handleError (error) {
  switch(error.code) {
    case -13:
      {
        if (fs.existsSync(path.resolve(walletDir, 'Wallet')) && fs.existsSync(path.resolve(walletDir, 'Wallet.keys')) && fs.existsSync(path.resolve(walletDir, 'Wallet.address.txt'))) {
          logger.debug('Found wallet! Opening wallet...')
          return openWallet()
        }
        logger.debug('Couldn\'t find wallet! Creating...')
        return createWallet()
      }
    case -21:
      throw new Error('Wallet already exists!')
    case -17:
      throw new E.InsufficientFundsError()
    case -37:
      throw new E.InsufficientFundsError()
    default:
      throw new Error(
        _.join(' ', [
          'json-rpc::got error:',
          JSON.stringify(_.get('message', error, '')),
          JSON.stringify(_.get('response.data.error', error, ''))
        ])
      )
  }
}

function openWallet () {
  return fetch('open_wallet', { filename: 'Wallet', password: rpcConfig.password })
}

function createWallet () {
  return fetch('create_wallet', { filename: 'Wallet', password: rpcConfig.password, language: 'English' })
    .then(() => new Promise(() => setTimeout(() => openWallet(), 3000)))
    .then(() => fetch('auto_refresh'))
}

function checkCryptoCode (cryptoCode) {
  if (cryptoCode !== 'XMR') return Promise.reject(new Error('Unsupported crypto: ' + cryptoCode))
  return Promise.resolve()
}

function refreshWallet () {
  return fetch('refresh')
}

function accountBalance (cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => refreshWallet())
    .then(() => fetch('get_balance', { account_index: 0, address_indices: [0] }))
    .then(res => {
      return BN(res.unlocked_balance).shift(unitScale).round()
    })
    .catch(err => handleError(err))
}

function balance (account, cryptoCode) {
  return accountBalance(cryptoCode)
}

function sendCoins (account, address, cryptoAtoms, cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => refreshWallet())
    .then(() => fetch('transfer_split', {
        destinations: [{ amount: cryptoAtoms, address }],
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
    .catch(err => handleError(err))
}

function newAddress (account, info) {
  return checkCryptoCode(info.cryptoCode)
    .then(() => fetch('create_address', { account_index: 0 }))
    .then(res => res.address)
    .catch(err => handleError(err))
}

function addressBalance (address, confirmations) {
  return fetch('get_address_index', { address: address })
    .then(addressRes => fetch('get_balance', { account_index: addressRes.index.major, address_indices: [addressRes.index.minor] }))
    .then(res => BN(res.unlocked_balance))
    .catch(err => handleError(err))
}

function confirmedBalance (address, cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => refreshWallet())
    .then(() => addressBalance(address, 1))
    .catch(err => handleError(err))
}

function pendingBalance (address, cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => refreshWallet())
    .then(() => addressBalance(address, 0))
    .catch(err => handleError(err))
}

function getStatus (account, toAddress, requested, cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => refreshWallet())
    .then(() => confirmedBalance(toAddress, cryptoCode))
    .then(confirmed => {
      if (confirmed.gte(requested)) return { receivedCryptoAtoms: confirmed, status: 'confirmed' }

      return pendingBalance(toAddress, cryptoCode)
        .then(pending => {
          if (pending.gte(requested)) return { receivedCryptoAtoms: pending, status: 'authorized' }
          if (pending.gt(0)) return { receivedCryptoAtoms: pending, status: 'insufficientFunds' }
          return { receivedCryptoAtoms: pending, status: 'notSeen' }
        })
    })
    .catch(err => handleError(err))
}

function newFunding (account, cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => refreshWallet())
    .then(() => fetch('get_balance', { account_index: 0, address_indices: [0] }))
    .then(balanceRes => Promise.all([
        balanceRes,
        fetch('create_address', { account_index: 0 })
      ]))
    .then(([balanceRes, addressRes]) => ({
      fundingPendingBalance: BN(balanceRes.balance).sub(balanceRes.unlocked_balance),
      fundingConfirmedBalance: BN(balanceRes.unlocked_balance),
      fundingAddress: addressRes.address
    }))
    .catch(err => handleError(err))
}

function cryptoNetwork (account, cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => {
      switch(parseInt(rpcConfig.port, 10)) {
        case 18083:
          return 'main'
        case 28083:
          return 'test'
        case 38083:
          return 'stage'
        default:
          return ''
      }
    })
}

module.exports = {
  balance,
  sendCoins,
  newAddress,
  getStatus,
  newFunding,
  cryptoNetwork
}
