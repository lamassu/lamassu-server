const https = require('https')
const BN = require('../../../bn')
const E = require('../../../error')
const _ = require('lodash/fp')

const ENV = process.env.NODE_ENV === undefined || process.env.NODE_ENV === 'development' ? 'development' : 'production'
const SUPPORTED_COINS = ['BTC']

const axios = require('axios').create({
  // TODO: get rejectUnauthorized true to work
  baseURL: `${process.env.WALLET_URL}/api`,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
})

const checkCryptoCode = (cryptoCode) => !_.includes(cryptoCode, SUPPORTED_COINS)
  ? Promise.reject(new Error('Unsupported crypto: ' + cryptoCode))
  : Promise.resolve()

function balance (account, cryptoCode, settings, operatorId) {
  return checkCryptoCode(cryptoCode)
    .then(() => {
      return axios.post('/balance', {
        cryptoCode,
        config: settings.config,
        operatorId
      })
    })
    .then(({ data }) => {
      if (data.error) throw new Error(JSON.stringify(data.error))
      return new BN(data.balance)
    })
}

function sendCoins (account, tx, settings, operatorId) {
  const { cryptoCode } = tx
  return checkCryptoCode(cryptoCode)
    .then(() => {
      return axios.post('/sendCoins', {
        tx,
        config: settings.config,
        operatorId
      })
    })
    .then(({ data }) => {
      if (data.error && data.error.errorCode === 'sc-001') throw new E.InsufficientFundsError()
      else if (data.error) throw new Error(JSON.stringify(data.error))
      const fee = new BN(data.fee).decimalPlaces(0)
      const txid = data.txid
      return { txid, fee }
    })
}

function newAddress (account, info, tx, settings, operatorId) {
  return checkCryptoCode(info.cryptoCode)
    .then(() => axios.post('/newAddress', {
      info,
      tx,
      config: settings.config,
      operatorId
    }))
    .then(({ data }) => {
      if(data.error) throw new Error(JSON.stringify(data.error))
      return data.newAddress
    })
}

function getStatus (account, tx, requested, settings, operatorId) {
  return checkCryptoCode(tx.cryptoCode)
    .then(() => axios.get(`/balance/${tx.toAddress}?cryptoCode=${tx.cryptoCode}`))
    .then(({ data }) => {
      if (data.error) throw new Error(JSON.stringify(data.error))
      const confirmed = new BN(data.confirmedBalance)
      const pending = new BN(data.pendingBalance)
      if (confirmed.gte(requested)) return { receivedCryptoAtoms: confirmed, status: 'confirmed' }
      if (pending.gte(requested)) return { receivedCryptoAtoms: pending, status: 'authorized' }
      if (pending.gt(0)) return { receivedCryptoAtoms: pending, status: 'insufficientFunds' }
      return { receivedCryptoAtoms: pending, status: 'notSeen' }
    })
}

function newFunding (account, cryptoCode, settings, operatorId) {
  throw new E.NotImplementedError()
}

function sweep (account, txId, cryptoCode, hdIndex, settings, operatorId) {
  throw new E.NotImplementedError()
}

function isStrictAddress (cryptoCode, toAddress, settings, operatorId) {
  throw new E.NotImplementedError()
}

module.exports = {
  balance,
  sendCoins,
  newAddress,
  newFunding,
  getStatus,
  sweep,
  supportsHd: true,
  isStrictAddress
}
