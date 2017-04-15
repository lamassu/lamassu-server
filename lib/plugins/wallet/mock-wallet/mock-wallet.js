const BN = require('../../../bn')

const NAME = 'FakeWallet'

const SECONDS = 1000
const UNSEEN_TIME = 6 * SECONDS
const PUBLISH_TIME = 12 * SECONDS
const AUTHORIZE_TIME = 60 * SECONDS

let t0

function balance (account, cryptoCode) {
  return Promise.resolve()
  .then(() => {
    if (cryptoCode === 'BTC') return BN(1e8 * 10)
    if (cryptoCode === 'ETH') return BN(1e18 * 10)
    throw new Error('Unsupported crypto: ' + cryptoCode)
  })
}

function sendCoins (account, toAddress, cryptoAtoms, cryptoCode) {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('[%s] DEBUG: Mock wallet sending %s cryptoAtoms to %s',
        cryptoCode, cryptoAtoms.toString(), toAddress)
      resolve('<txHash>')
    }, 2000)
  })
}

function newAddress () {
  t0 = Date.now()
  return Promise.resolve('<Fake address, don\'t send>')
}

function getStatus (account, toAddress, cryptoAtoms, cryptoCode) {
  const elapsed = Date.now() - t0

  if (elapsed < UNSEEN_TIME) return Promise.resolve({status: 'notSeen'})
  if (elapsed < PUBLISH_TIME) return Promise.resolve({status: 'published'})
  if (elapsed < AUTHORIZE_TIME) return Promise.resolve({status: 'authorized'})

  console.log('[%s] DEBUG: Mock wallet has confirmed transaction', cryptoCode)
  return Promise.resolve({status: 'confirmed'})
}

module.exports = {
  NAME,
  balance,
  sendCoins,
  newAddress,
  getStatus
}
