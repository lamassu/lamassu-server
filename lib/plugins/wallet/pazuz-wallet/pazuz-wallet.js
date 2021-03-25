const https = require('https')
const BN = require('../../../bn')
const E = require('../../../error')

const axios = require('axios').create({
  // TODO: get rejectUnauthorized true to work
  baseURL: 'https://localhost:5555/api/',
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
})

const SUPPORTED_COINS = ['BTC', 'ZEC', 'LTC', 'BCH', 'DASH', 'ETH']

function checkCryptoCode (cryptoCode) {
  if (!SUPPORTED_COINS.includes(cryptoCode)) {
    return Promise.reject(new Error('Unsupported crypto: ' + cryptoCode))
  }

  return Promise.resolve()
}

function balance (account, cryptoCode, settings, operatorId) {
  return checkCryptoCode(cryptoCode)
    .then(() => {
      return axios.post('/balance', {
        account,
        cryptoCode,
        settings,
        operatorId
      })
    })
    .then(({ data }) => {
      if (data.error) throw new Error(JSON.stringify({ errorCode: data.error.errorCode, message: data.error.message }))
      return BN(data.balance)
    })
}

function sendCoins (account, tx, settings, operatorId) {
  const { cryptoCode } = tx
  return checkCryptoCode(cryptoCode)
    .then(() => {
      return axios.post('/sendCoins', {
        account,
        tx,
        settings,
        operatorId
      })
    })
    .then(({ data }) => {
      if (data.error && data.error.errorCode === 'sc-001') throw new E.InsufficientFundsError()
      else if (data.error) throw new Error(JSON.stringify({ errorCode: data.error.errorCode, message: data.error.message }))
      const fee = BN(data.fee).round()
      const txid = data.txid
      return { txid, fee }
    })
}

function newAddress (account, info, tx, settings, operatorId) {
  return checkCryptoCode(info.cryptoCode)
    .then(() => axios.post('/newAddress', {
      account,
      info,
      tx,
      settings,
      operatorId
    }))
    .then(({ data }) => {
      return data.newAddress
    })
}

function newFunding (account, cryptoCode, settings, operatorId) {
  return axios.post('/newFunding', {
    account,
    cryptoCode,
    settings,
    operatorId
  }).catch(console.error)
}

function getStatus (account, tx, requested, settings, operatorId) {
  return axios.post('/getStatus', {
    account,
    tx,
    requested,
    settings,
    operatorId
  }).catch(console.error)
}

function sweep (account, cryptoCode, hdIndex, settings, operatorId) {
  return axios.post('/sweep', {
    account,
    cryptoCode,
    hdIndex,
    settings,
    operatorId
  }).catch(console.error)
}

function cryptoNetwork (account, cryptoCode, settings, operatorId) {
  return checkCryptoCode(cryptoCode)
    .then(() => axios.post('/cryptoNetwork', {
      account,
      cryptoCode,
      settings,
      operatorId
    }))
    .then(({ data }) => {
      if (data.error && data.error.errorCode === 'cn-001') return false
      else if (data.error) throw new Error(JSON.stringify({ error: data.error, message: data.error.message }))
      return data.cryptoNetwork
    })
}

function isStrictAddress (cryptoCode, toAddress, settings, operatorId) {
  return axios.post('/isStrictAddress', {
    cryptoCode,
    toAddress,
    settings,
    operatorId
  }).catch(console.error)
}

module.exports = {
  balance,
  sendCoins,
  newAddress,
  newFunding,
  getStatus,
  sweep,
  supportsHd: true,
  cryptoNetwork,
  isStrictAddress
}
