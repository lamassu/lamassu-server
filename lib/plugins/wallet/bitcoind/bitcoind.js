const path = require('path')
const os = require('os')
const RpcClient = require('bitcoind-rpc')
const fs = require('fs')
const pify = require('pify')

const BN = require('../../../bn')
const E = require('../../../error')

const NAME = 'Bitcoind'

const SATOSHI_SHIFT = 8

const configPath = path.resolve(os.homedir(), '.bitcoin', 'bitcoin.conf')
const pluginConfig = {
  account: '',
  bitcoindConfigurationPath: configPath
}

function initRpc () {
  const bitcoindConf = parseConf(pluginConfig.bitcoindConfigurationPath)

  const rpcConfig = {
    protocol: 'http',
    user: bitcoindConf.rpcuser,
    pass: bitcoindConf.rpcpassword
  }

  return new RpcClient(rpcConfig)
}

/*
 * initialize RpcClient
 */
function parseConf (confPath) {
  const conf = fs.readFileSync(confPath)
  const lines = conf.toString().split('\n')

  const res = {}
  for (let i = 0; i < lines.length; i++) {
    const keyVal = lines[i].split('=')

    // skip when value is empty
    if (!keyVal[1]) continue

    res[keyVal[0]] = keyVal[1]
  }

  return res
}

function checkCryptoCode (cryptoCode) {
  if (cryptoCode !== 'BTC') return Promise.reject(new Error('Unsupported crypto: ' + cryptoCode))
  return Promise.resolve()
}

function accountBalance (account, cryptoCode, confirmations) {
  return checkCryptoCode(cryptoCode)
  .then(() => {
    const rpc = initRpc()

    return new Promise((resolve, reject) => {
      rpc.getBalance(pluginConfig.account, confirmations, (err, result) => {
        if (err) return reject(err)
        if (result.error) reject(new Error(err))

        return resolve(BN(result.result).shift(SATOSHI_SHIFT).round())
      })
    })
  })
}

// We want a balance that includes all spends (0 conf) but only deposits that
// have at least 1 confirmation. getbalance does this for us automatically.
function balance (account, cryptoCode) {
  return accountBalance(account, cryptoCode, 1)
}

function sendCoins (account, address, cryptoAtoms, cryptoCode) {
  const rpc = initRpc()
  const confirmations = 1
  const bitcoins = cryptoAtoms.shift(-SATOSHI_SHIFT).toFixed(8)

  return checkCryptoCode(cryptoCode)
  .then(() => {
    return new Promise((resolve, reject) => {
      rpc.sendFrom(pluginConfig.account, address, bitcoins, confirmations, (err, result) => {
        if (err) {
          if (err.code === -6) return reject(new E.InsufficientFundsError())
          return reject(err)
        }

        resolve(result.result)
      })
    })
  })
}

function newAddress (account, info) {
  return checkCryptoCode(info.cryptoCode)
  .then(() => {
    return new Promise((resolve, reject) => {
      const rpc = initRpc()
      rpc.getNewAddress((err, result) => {
        if (err) return reject(err)
        resolve(result.result)
      })
    })
  })
}

function addressBalance (address, confs) {
  const rpc = initRpc()
  return pify(rpc.getReceivedByAddress.bind(rpc))(address, confs)
  .then(r => BN(r.result).shift(SATOSHI_SHIFT).round())
}

function confirmedBalance (address, cryptoCode) {
  return checkCryptoCode(cryptoCode)
  .then(() => addressBalance(address, 1))
}

function pendingBalance (address, cryptoCode) {
  return checkCryptoCode(cryptoCode)
  .then(() => addressBalance(address, 0))
}

function getStatus (account, toAddress, requested, cryptoCode) {
  return checkCryptoCode(cryptoCode)
  .then(() => confirmedBalance(toAddress, cryptoCode))
  .then(confirmed => {
    if (confirmed.gte(requested)) return {status: 'confirmed'}

    return pendingBalance(toAddress, cryptoCode)
    .then(pending => {
      if (pending.gte(requested)) return {status: 'authorized'}
      if (pending.gt(0)) return {status: 'insufficientFunds'}
      return {status: 'notSeen'}
    })
  })
}

function newFunding (account, cryptoCode) {
  return checkCryptoCode(cryptoCode)
  .then(() => {
    const promises = [
      accountBalance(account, cryptoCode, 0),
      accountBalance(account, cryptoCode, 1),
      newAddress(account, {cryptoCode})
    ]

    return Promise.all(promises)
  })
  .then(([fundingPendingBalance, fundingConfirmedBalance, fundingAddress]) => ({
    fundingPendingBalance,
    fundingConfirmedBalance,
    fundingAddress
  }))
}

module.exports = {
  NAME,
  balance,
  pendingBalance,
  confirmedBalance,
  sendCoins,
  newAddress,
  getStatus,
  newFunding
}
