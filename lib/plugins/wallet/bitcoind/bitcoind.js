const path = require('path')
const os = require('os')
const RpcClient = require('bitcoind-rpc')
const fs = require('fs')
const pify = require('pify')

const BN = require('../../../bn')

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

function richError (msg, name) {
  const err = new Error(msg)
  err.name = name
  return err
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
  if (cryptoCode !== 'BTC') throw new Error('Unsupported crypto: ' + cryptoCode)
}

// We want a balance that includes all spends (0 conf) but only deposits that
// have at least 1 confirmation. getbalance does this for us automatically.
function balance (account, cryptoCode) {
  return new Promise((resolve, reject) => {
    checkCryptoCode(cryptoCode)
    const rpc = initRpc()
    rpc.getBalance(pluginConfig.account, 1, (err, result) => {
      if (err) return reject(err)

      if (result.error) {
        return reject(richError(result.error, 'bitcoindError'))
      }

      resolve(BN(result.result).shift(SATOSHI_SHIFT).round())
    })
  })
}

function sendCoins (account, address, cryptoAtoms, cryptoCode) {
  const rpc = initRpc()
  const confirmations = 1
  const bitcoins = cryptoAtoms.shift(-SATOSHI_SHIFT).toFixed(8)

  return new Promise((resolve, reject) => {
    checkCryptoCode(cryptoCode)
    rpc.sendFrom(pluginConfig.account, address, bitcoins, confirmations, (err, result) => {
      if (err) {
        if (err.code === -6) {
          return reject(richError('Insufficient funds', 'InsufficientFunds'))
        }

        if (err instanceof Error) {
          return reject(err)
        }

        return reject(richError(err.message, 'bitcoindError'))
      }

      resolve(result.result)
    })
  })
}

function newAddress (account, cryptoCode, info) {
  return new Promise((resolve, reject) => {
    checkCryptoCode(cryptoCode)
    const rpc = initRpc()
    rpc.getNewAddress((err, result) => {
      if (err) return reject(err)
      resolve(result.result)
    })
  })
}

function addressBalance (address, confs) {
  const rpc = initRpc()
  return pify(rpc.getReceivedByAddress.bind(rpc))(address, confs)
  .then(r => BN(r.result).shift(SATOSHI_SHIFT).round())
}

const confirmedBalance = address => addressBalance(address, 1)
const pendingBalance = address => addressBalance(address, 0)

function getStatus (account, toAddress, requested, cryptoCode) {
  return Promise.resolve()
  .then(() => checkCryptoCode(cryptoCode))
  .then(() => confirmedBalance(toAddress))
  .then(confirmed => {
    if (confirmed.gte(requested)) return {status: 'confirmed'}

    return pendingBalance(toAddress)
    .then(pending => {
      if (pending.gte(requested)) return {status: 'authorized'}
      if (pending.gt(0)) return {status: 'insufficientFunds'}
      return {status: 'notSeen'}
    })
  })
}

module.exports = {
  NAME,
  balance,
  sendCoins,
  newAddress,
  getStatus
}
