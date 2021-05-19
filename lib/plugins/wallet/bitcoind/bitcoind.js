const _ = require('lodash/fp')
const jsonRpc = require('../../common/json-rpc')

const options = require('../../../options')
const BN = require('../../../bn')
const E = require('../../../error')
const logger = require('../../../logger')
const { utils: coinUtils } = require('lamassu-coins')

const cryptoRec = coinUtils.getCryptoCurrency('BTC')
const configPath = coinUtils.configPath(cryptoRec, options.blockchainDir)
const unitScale = cryptoRec.unitScale

function rpcConfig () {
  try {
    const config = jsonRpc.parseConf(configPath)
    return {
      username: config.rpcuser,
      password: config.rpcpassword,
      port: config.rpcport || cryptoRec.defaultPort
    }
  } catch (err) {
    throw new Error('wallet is currently not installed')
  }
}

function fetch (method, params) {
  return jsonRpc.fetch(rpcConfig(), method, params)
}

function checkCryptoCode (cryptoCode) {
  if (cryptoCode !== 'BTC') return Promise.reject(new Error('Unsupported crypto: ' + cryptoCode))
  return Promise.resolve()
}

function accountBalance (cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => fetch('getwalletinfo'))
    .then(({ balance }) => new BN(balance).shiftedBy(unitScale).decimalPlaces(0))
}

function accountUnconfirmedBalance (cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => fetch('getwalletinfo'))
    .then(({ unconfirmed_balance: balance }) => new BN(balance).shiftedBy(unitScale).decimalPlaces(0))
}

// We want a balance that includes all spends (0 conf) but only deposits that
// have at least 1 confirmation. getbalance does this for us automatically.
function balance (account, cryptoCode, settings, operatorId) {
  return accountBalance(cryptoCode)
}

function estimateFee () {
  return fetch('estimatesmartfee', [6, 'unset'])
    .then(result => BN(result.feerate))
    .catch(() => {})
}

function calculateFeeDiscount (feeDiscount) {
  // 0 makes bitcoind do automatic fee selection
  const AUTOMATIC_FEE = 0
  if (!feeDiscount) return AUTOMATIC_FEE
  return estimateFee()
    .then(estimatedFee => {
      if (!estimatedFee) return AUTOMATIC_FEE
      const newFee = estimatedFee.times(feeDiscount)
      if (newFee.lt(0.00001) || newFee.gt(0.1)) return AUTOMATIC_FEE
      return newFee
    })
}

function sendCoins (account, tx, settings, operatorId, feeDiscount) {
  const { toAddress, cryptoAtoms, cryptoCode } = tx
  const coins = cryptoAtoms.shiftedBy(-unitScale).toFixed(8)

  return checkCryptoCode(cryptoCode)
    .then(() => calculateFeeDiscount(feeDiscount))
    .then(newFee => fetch('settxfee', [newFee]))
    .then(() => fetch('sendtoaddress', [toAddress, coins]))
    .then((txId) => fetch('gettransaction', [txId]))
    .then((res) => _.pick(['fee', 'txid'], res))
    .then((pickedObj) => {
      return {
        fee: new BN(pickedObj.fee).abs().shiftedBy(unitScale).decimalPlaces(0),
        txid: pickedObj.txid
      }
    })
    .catch(err => {
      if (err.code === -6) throw new E.InsufficientFundsError()
      throw err
    })
}

function newAddress (account, info, tx, settings, operatorId) {
  return checkCryptoCode(info.cryptoCode)
    .then(() => fetch('getnewaddress'))
}

function addressBalance (address, confs) {
  return fetch('getreceivedbyaddress', [address, confs])
    .then(r => new BN(r).shiftedBy(unitScale).decimalPlaces(0))
}

function confirmedBalance (address, cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => addressBalance(address, 1))
}

function pendingBalance (address, cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => addressBalance(address, 0))
}

function getStatus (account, tx, requested, settings, operatorId) {
  const { toAddress, cryptoCode } = tx
  return checkCryptoCode(cryptoCode)
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
}

function newFunding (account, cryptoCode, settings, operatorId) {
  return checkCryptoCode(cryptoCode)
    .then(() => {
      const promises = [
        accountUnconfirmedBalance(cryptoCode),
        accountBalance(cryptoCode),
        newAddress(account, { cryptoCode })
      ]

      return Promise.all(promises)
    })
    .then(([fundingPendingBalance, fundingConfirmedBalance, fundingAddress]) => ({
      fundingPendingBalance,
      fundingConfirmedBalance,
      fundingAddress
    }))
}

function cryptoNetwork (account, cryptoCode, settings, operatorId) {
  return checkCryptoCode(cryptoCode)
    .then(() => parseInt(rpcConfig.port, 10) === 18332 ? 'test' : 'main')
}

function fetchRBF (txId) {
  return fetch('getmempoolentry', [txId])
    .then((res) => {
      return [txId, res['bip125-replaceable']]
    })
    .catch(err => {
      if (err.code === -5) logger.error(`${err.message}`)
      return [txId, true]
    })
}

module.exports = {
  balance,
  sendCoins,
  newAddress,
  getStatus,
  newFunding,
  cryptoNetwork,
  fetchRBF,
  estimateFee
}
