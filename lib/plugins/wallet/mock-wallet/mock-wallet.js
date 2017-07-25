const BN = require('../../../bn')
const E = require('../../../error')
const coinUtils = require('../../../coin-utils')

const NAME = 'FakeWallet'

const SECONDS = 1000
const PUBLISH_TIME = 2 * SECONDS
const AUTHORIZE_TIME = PUBLISH_TIME + 6 * SECONDS
const CONFIRM_TIME = AUTHORIZE_TIME + 180 * SECONDS

let t0

function _balance (cryptoCode) {
  const cryptoRec = coinUtils.getCryptoCurrency(cryptoCode)
  const unitScale = cryptoRec.unitScale
  return BN(10).shift(unitScale).round()
}

function balance (account, cryptoCode) {
  return Promise.resolve()
  .then(() => _balance(cryptoCode))
}

function pendingBalance (account, cryptoCode) {
  return balance(account, cryptoCode)
  .then(b => b.mul(1.1))
}

function confirmedBalance (account, cryptoCode) {
  return balance(account, cryptoCode)
}

// Note: This makes it easier to test insufficient funds errors
let sendCount = 100

function isInsufficient (cryptoAtoms, cryptoCode) {
  const b = _balance(cryptoCode)
  return cryptoAtoms.gt(b.div(1000).mul(sendCount))
}

function sendCoins (account, toAddress, cryptoAtoms, cryptoCode) {
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
      return resolve('<txHash>')
    }, 2000)
  })
}

function newAddress () {
  t0 = Date.now()
  return Promise.resolve('<Fake address, don\'t send>')
}

function newFunding (account, cryptoCode) {
  const promises = [
    pendingBalance(account, cryptoCode),
    confirmedBalance(account, cryptoCode),
    newAddress(account, {cryptoCode})
  ]

  return Promise.all(promises)
  .then(([fundingPendingBalance, fundingConfirmedBalance, fundingAddress]) => ({
    fundingPendingBalance,
    fundingConfirmedBalance,
    fundingAddress
  }))
}

function getStatus (account, toAddress, cryptoAtoms, cryptoCode) {
  const elapsed = Date.now() - t0

  if (elapsed < PUBLISH_TIME) return Promise.resolve({status: 'notSeen'})
  if (elapsed < AUTHORIZE_TIME) return Promise.resolve({status: 'published'})
  if (elapsed < CONFIRM_TIME) return Promise.resolve({status: 'authorized'})

  console.log('[%s] DEBUG: Mock wallet has confirmed transaction', cryptoCode)
  return Promise.resolve({status: 'confirmed'})
}

module.exports = {
  NAME,
  balance,
  sendCoins,
  newAddress,
  getStatus,
  newFunding
}
