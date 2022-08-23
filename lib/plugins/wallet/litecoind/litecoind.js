const _ = require('lodash/fp')
const jsonRpc = require('../../common/json-rpc')

const { utils: coinUtils } = require('@lamassu/coins')

const BN = require('../../../bn')
const E = require('../../../error')

const cryptoRec = coinUtils.getCryptoCurrency('LTC')
const unitScale = cryptoRec.unitScale

const rpcConfig = jsonRpc.rpcConfig(cryptoRec)

function fetch (method, params) {
  return jsonRpc.fetch(rpcConfig, method, params)
}

function errorHandle (e) {
  const err = JSON.parse(e.message)
  switch (err.code) {
    case -6:
      throw new E.InsufficientFundsError()
    default:
      throw e
  }
}

function checkCryptoCode (cryptoCode) {
  if (cryptoCode !== 'LTC') return Promise.reject(new Error('Unsupported crypto: ' + cryptoCode))
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

function sendCoins (account, tx, settings, operatorId) {
  const { toAddress, cryptoAtoms, cryptoCode } = tx
  const coins = cryptoAtoms.shiftedBy(-unitScale).toFixed(8)

  return checkCryptoCode(cryptoCode)
    .then(() => fetch('sendtoaddress', [toAddress, coins]))
    .then((txId) => fetch('gettransaction', [txId]))
    .then((res) => _.pick(['fee', 'txid'], res))
    .then((pickedObj) => {
      return {
        fee: new BN(pickedObj.fee).abs().shiftedBy(unitScale).decimalPlaces(0),
        txid: pickedObj.txid
      }
    })
    .catch(errorHandle)
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

function checkBlockchainStatus (cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => fetch('getblockchaininfo'))
    .then(res => !!res['initialblockdownload'] ? 'syncing' : 'ready')
}

function getTxHashesByAddress (cryptoCode, address) {
  throw new Error(`Transactions hash retrieval not implemented for this coin!`)
}

module.exports = {
  balance,
  sendCoins,
  newAddress,
  getStatus,
  newFunding,
  checkBlockchainStatus,
  getTxHashesByAddress
}
