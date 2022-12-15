const _ = require('lodash/fp')

const BN = require('../../../bn')
const E = require('../../../error')
const { utils: coinUtils } = require('@lamassu/coins')

const NAME = 'FakeWallet'

const SECONDS = 1000
const PUBLISH_TIME = 3 * SECONDS
const AUTHORIZE_TIME = PUBLISH_TIME + 5 * SECONDS
const CONFIRM_TIME = AUTHORIZE_TIME + 10 * SECONDS
const SUPPORTED_COINS = coinUtils.cryptoCurrencies()

let t0

const checkCryptoCode = (cryptoCode) => !_.includes(cryptoCode, SUPPORTED_COINS)
  ? Promise.reject(new Error('Unsupported crypto: ' + cryptoCode))
  : Promise.resolve()

function _balance (cryptoCode) {
  const cryptoRec = coinUtils.getCryptoCurrency(cryptoCode)
  const unitScale = cryptoRec.unitScale
  return new BN(10).shiftedBy(unitScale).decimalPlaces(0)
}

function balance (account, cryptoCode, settings, operatorId) {
  return Promise.resolve()
    .then(() => _balance(cryptoCode))
}

function pendingBalance (account, cryptoCode) {
  return balance(account, cryptoCode)
    .then(b => b.times(1.1))
}

function confirmedBalance (account, cryptoCode) {
  return balance(account, cryptoCode)
}

// Note: This makes it easier to test insufficient funds errors
let sendCount = 100

function isInsufficient (cryptoAtoms, cryptoCode) {
  const b = _balance(cryptoCode)
  return cryptoAtoms.gt(b.div(1000).times(sendCount))
}

function sendCoins (account, tx, settings, operatorId) {
  const { toAddress, cryptoAtoms, cryptoCode } = tx
  sendCount++
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (isInsufficient(cryptoAtoms, cryptoCode)) {
        console.log('[%s] DEBUG: Mock wallet insufficient funds: %s',
          cryptoCode, cryptoAtoms.toString())
        return reject(new E.InsufficientFundsError())
      }

      console.log('[%s] DEBUG: Mock wallet sending %s cryptoAtoms to %s',
        cryptoCode, cryptoAtoms.toString(), toAddress)
      return resolve({ txid: '<txHash>', fee: new BN(0) })
    }, 2000)
  })
}

function sendCoinsBatch (account, txs, cryptoCode) {
  sendCount = sendCount + txs.length
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const cryptoSum = _.reduce((acc, value) => acc.plus(value.crypto_atoms), BN(0), txs)
      if (isInsufficient(cryptoSum, cryptoCode)) {
        console.log('[%s] DEBUG: Mock wallet insufficient funds: %s',
          cryptoCode, cryptoSum.toString())
        return reject(new E.InsufficientFundsError())
      }

      console.log('[%s] DEBUG: Mock wallet sending %s cryptoAtoms in a batch',
        cryptoCode, cryptoSum.toString())
      return resolve({ txid: '<txHash>', fee: BN(0) })
    }, 2000)
  })
}

function newAddress () {
  t0 = Date.now()
  return Promise.resolve('<Fake address, don\'t send>')
}

function newFunding (account, cryptoCode, settings, operatorId) {
  const promises = [
    pendingBalance(account, cryptoCode),
    confirmedBalance(account, cryptoCode),
    newAddress(account, { cryptoCode })
  ]

  return Promise.all(promises)
    .then(([fundingPendingBalance, fundingConfirmedBalance, fundingAddress]) => ({
      fundingPendingBalance,
      fundingConfirmedBalance,
      fundingAddress
    }))
}

function getStatus (account, tx, requested, settings, operatorId) {
  const { toAddress, cryptoCode } = tx
  const elapsed = Date.now() - t0

  if (elapsed < PUBLISH_TIME) return Promise.resolve({ receivedCryptoAtoms: new BN(0), status: 'notSeen' })
  if (elapsed < AUTHORIZE_TIME) return Promise.resolve({ receivedCryptoAtoms: requested, status: 'published' })
  if (elapsed < CONFIRM_TIME) return Promise.resolve({ receivedCryptoAtoms: requested, status: 'authorized' })

  console.log('[%s] DEBUG: Mock wallet has confirmed transaction [%s]', cryptoCode, toAddress.slice(0, 5))

  return Promise.resolve({ status: 'confirmed' })
}

function getTxHashesByAddress (cryptoCode, address) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      return resolve([]) // TODO: should return something other than empty list?
    }, 100)
  })
}

function checkBlockchainStatus (cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => Promise.resolve('ready'))
}

module.exports = {
  NAME,
  balance,
  sendCoinsBatch,
  sendCoins,
  newAddress,
  getStatus,
  newFunding,
  checkBlockchainStatus,
  getTxHashesByAddress
}
