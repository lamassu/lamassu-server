const _ = require('lodash/fp')
const pRetry = require('p-retry') 
const jsonRpc = require('../../common/json-rpc')

const { utils: coinUtils } = require('@lamassu/coins')

const BN = require('../../../bn')
const E = require('../../../error')

const cryptoRec = coinUtils.getCryptoCurrency('ZEC')
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
  if (cryptoCode !== 'ZEC') return Promise.reject(new Error('Unsupported crypto: ' + cryptoCode))
  return Promise.resolve()
}

function accountBalance (cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => fetch('z_listaccounts'))
    .then(accountsRes => _.isEmpty(accountsRes) ? fetch('z_getnewaccount') : Promise.resolve(_.first(accountsRes)))
    .then(account => fetch('z_getbalanceforaccount', [account.account, 1]))
    .then(res => new BN(res.pools.transparent.valueZat).plus(res.pools.sapling.valueZat).plus(res.pools.orchard.valueZat))
}

function accountUnconfirmedBalance (cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => fetch('z_listaccounts'))
    .then(accountsRes => _.isEmpty(accountsRes) ? fetch('z_getnewaccount') : Promise.resolve(_.first(accountsRes)))
    .then(account => fetch('z_getbalanceforaccount', [account.account, 0]))
    .then(res => new BN(res.pools.transparent.valueZat).plus(res.pools.sapling.valueZat).plus(res.pools.orchard.valueZat))
}

// We want a balance that includes all spends (0 conf) but only deposits that
// have at least 1 confirmation. getbalance does this for us automatically.
function balance (account, cryptoCode, settings, operatorId) {
  return accountBalance(cryptoCode)
}

function sendCoins (account, tx, settings, operatorId) {
  const { toAddress, cryptoAtoms, cryptoCode } = tx
  const coins = cryptoAtoms.shiftedBy(-unitScale).toFixed(8)
  const checkSendStatus = function (opid) {
    return new Promise((resolve, reject) => {
      fetch('z_getoperationstatus', [[opid]])
        .then(res => {
          const status = _.get('status', res[0])
          switch (status) {
            case 'success':
              resolve(res[0])
              break
            case 'failed':
              throw new pRetry.AbortError(res[0].error)
            case 'executing':
              reject(new Error('operation still executing'))
              break
          }
        })
    })
  }

  const checker = opid => pRetry(() => checkSendStatus(opid), { retries: 20, minTimeout: 300, factor: 1.05 })

  return checkCryptoCode(cryptoCode)
    .then(() => fetch('z_sendmany', [defaultAddress(account, { cryptoCode }), [{ address: toAddress, amount: coins }]]))
    .then(checker)
    .then((res) => {
      return {
        fee: _.get('params.fee', res),
        txid: _.get('result.txid', res)
      }
    })
    .then((pickedObj) => {
      return {
        fee: new BN(pickedObj.fee).abs().shiftedBy(unitScale).decimalPlaces(0),
        txid: pickedObj.txid
      }
    })
    .catch(errorHandle)
}

function defaultAddress (account, info, tx, settings, operatorId) {
  return checkCryptoCode(info.cryptoCode)
    .then(() => fetch('z_listaccounts'))
    .then(accountsRes => _.isEmpty(accountsRes) ? fetch('z_getnewaccount') : Promise.resolve(_.first(accountsRes)))
    .then(account => fetch('z_getaddressforaccount', [account.account, [], 0]))
    .then(res => res.address)
}

function newAddress (account, info, tx, settings, operatorId) {
  return checkCryptoCode(info.cryptoCode)
    .then(() => fetch('z_listaccounts'))
    .then(accountsRes => _.isEmpty(accountsRes) ? fetch('z_getnewaccount') : Promise.resolve(_.first(accountsRes)))
    .then(account => fetch('z_getaddressforaccount', [account.account]))
    .then(res => res.address)
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
        defaultAddress(account, { cryptoCode })
      ]

      return Promise.all(promises)
    })
    .then(([fundingUnconfirmedBalance, fundingConfirmedBalance, fundingAddress]) => ({
      fundingPendingBalance: new BN(fundingUnconfirmedBalance).minus(fundingConfirmedBalance),
      fundingConfirmedBalance,
      fundingAddress
    }))
}

function checkBlockchainStatus (cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => fetch('getblockchaininfo'))
    .then(res => !!res['initial_block_download_complete'] ? 'ready' : 'syncing')
}

module.exports = {
  balance,
  sendCoins,
  newAddress,
  getStatus,
  newFunding,
  checkBlockchainStatus
}
