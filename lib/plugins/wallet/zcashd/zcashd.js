const _ = require('lodash/fp')
const jsonRpc = require('../../common/json-rpc')

const coinUtils = require('../../../coin-utils')

const BN = require('../../../bn')
const E = require('../../../error')

const cryptoRec = coinUtils.getCryptoCurrency('ZEC')
const configPath = coinUtils.configPath(cryptoRec)
const unitScale = cryptoRec.unitScale
const config = jsonRpc.parseConf(configPath)

const rpcConfig = {
  username: config.rpcuser,
  password: config.rpcpassword,
  port: config.rpcport || cryptoRec.defaultPort
}

function fetch (method, params) {
  return jsonRpc.fetch(rpcConfig, method, params)
}

function checkCryptoCode (cryptoCode) {
  if (cryptoCode !== 'ZEC') return Promise.reject(new Error('Unsupported crypto: ' + cryptoCode))
  return Promise.resolve()
}

function accountBalance (cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => fetch('getwalletinfo'))
    .then(({ balance }) => BN(balance).shift(unitScale).round())
}

function accountUnconfirmedBalance (cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => fetch('getwalletinfo'))
    .then(({ unconfirmed_balance: balance }) => BN(balance).shift(unitScale).round())
}

// We want a balance that includes all spends (0 conf) but only deposits that
// have at least 1 confirmation. getbalance does this for us automatically.
function balance (account, cryptoCode) {
  return accountBalance(cryptoCode)
}

function sendCoins (account, address, cryptoAtoms, cryptoCode) {
  const coins = cryptoAtoms.shift(-unitScale).toFixed(8)
  const checkSendStatus = function (opid) {
    return new Promise((resolve, reject) => {
      function checker(timeout) {
        setTimeout(() => {
          fetch('z_getoperationstatus', [[opid]])
            .then(res => {
              const status = _.get('status', res[0])
              switch(status) {
                case 'success': 
                  resolve(res[0])
                  break
                case 'failed': 
                  reject(res[0].error)
                  break
                case 'executing':
                  if (timeout > 0) {
                    checker(timeout - 500)
                  } else {
                    reject(res)
                  }
              }
            })
        }, 500)
      }
      checker(10000)
    })
  } 
  return checkCryptoCode(cryptoCode)
    .then(() => fetch('z_sendmany', ["ANY_TADDR", [{address, amount: coins}]]))
    .then(checkSendStatus)
    .then((res) =>  {
      return {
        fee: _.get('params.fee', res),
        txid: _.get('result.txid', res)
      }
    })
    .then((pickedObj) => {
      return {
        fee: BN(pickedObj.fee).abs().shift(unitScale).round(),
        txid: pickedObj.txid
      }
    })
    .catch(err => {
      if (err.code === -6) throw new E.InsufficientFundsError()
      throw err
    })
}

function newAddress (account, info) {
  return checkCryptoCode(info.cryptoCode)
    .then(() => fetch('getnewaddress'))
}

function addressBalance (address, confs) {
  return fetch('getreceivedbyaddress', [address, confs])
    .then(r => BN(r).shift(unitScale).round())
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
      if (confirmed.gte(requested)) return { receivedCryptoAtoms: confirmed, status: 'confirmed' }

      return pendingBalance(toAddress, cryptoCode)
        .then(pending => {
          if (pending.gte(requested)) return { receivedCryptoAtoms: pending, status: 'authorized' }
          if (pending.gt(0)) return { receivedCryptoAtoms: pending, status: 'insufficientFunds' }
          return { receivedCryptoAtoms: pending, status: 'notSeen' }
        })
    })
}

function newFunding (account, cryptoCode) {
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

module.exports = {
  balance,
  sendCoins,
  newAddress,
  getStatus,
  newFunding
}
