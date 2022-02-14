const fs = require('fs')
const path = require('path')
const _ = require('lodash/fp')
const jsonRpc = require('../../common/json-rpc')

const { COINS, utils } = require('lamassu-coins')

const BN = require('../../../bn')
const E = require('../../../error')
const { logger } = require('../../../blockchain/common')
const options = require('../../../options')

const blockchainDir = options.blockchainDir

const cryptoRec = utils.getCryptoCurrency(COINS.XMR)
const configPath = utils.configPath(cryptoRec, blockchainDir)
const walletDir = path.resolve(utils.cryptoDir(cryptoRec, blockchainDir), 'wallets')
const unitScale = cryptoRec.unitScale

function rpcConfig () {
  try {
    const config = jsonRpc.parseConf(configPath)
    return {
      username: config['rpc-login'].split(':')[0],
      password: config['rpc-login'].split(':')[1],
      port: cryptoRec.walletPort || cryptoRec.defaultPort
    }
  } catch (err) {
    throw new Error('wallet is currently not installed')
  }
}

function fetch (method, params) {
  return jsonRpc.fetchDigest(rpcConfig(), method, params)
}

function handleError (error) {
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
  return fetch('open_wallet', { filename: 'Wallet', password: rpcConfig().password })
}

function createWallet () {
  return fetch('create_wallet', { filename: 'Wallet', password: rpcConfig().password, language: 'English' })
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
      return BN(res.unlocked_balance).decimalPlaces(0)
    })
    .catch(err => handleError(err))
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
    .catch(err => handleError(err))
}

function newAddress (account, info, tx, settings, operatorId) {
  return checkCryptoCode(info.cryptoCode)
    .then(() => fetch('create_address', { account_index: 0 }))
    .then(res => res.address)
    .catch(err => handleError(err))
}

function addressBalance (address, confirmations) {
  return fetch('get_address_index', { address: address })
    .then(addressRes => fetch('get_balance', { account_index: addressRes.index.major, address_indices: [addressRes.index.minor] }))
    .then(res => BN(_.find(it => it.address === address, res.per_subaddress).unlocked_balance))
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

function getStatus (account, tx, requested, settings, operatorId) {
  const { toAddress, cryptoCode } = tx
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

function newFunding (account, cryptoCode, settings, operatorId) {
  return checkCryptoCode(cryptoCode)
    .then(() => refreshWallet())
    .then(() => fetch('get_balance', { account_index: 0, address_indices: [0] }))
    .then(balanceRes => Promise.all([
        balanceRes,
        fetch('create_address', { account_index: 0 })
      ]))
    .then(([balanceRes, addressRes]) => ({
      fundingPendingBalance: BN(balanceRes.balance).minus(balanceRes.unlocked_balance),
      fundingConfirmedBalance: BN(balanceRes.unlocked_balance),
      fundingAddress: addressRes.address
    }))
    .catch(err => handleError(err))
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
        .then(res => {
          console.log('res XMR', res)
          return !!res.synchronized ? 'ready' : 'syncing'
        })
    } catch (err) {
      throw new Error('XMR daemon is currently not installed')
    }
  })
}

module.exports = {
  balance,
  sendCoins,
  newAddress,
  getStatus,
  newFunding,
  cryptoNetwork,
  checkBlockchainStatus
}
