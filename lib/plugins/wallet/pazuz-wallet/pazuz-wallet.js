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

const SUPPORTED_COINS = ['BTC']

function checkCryptoCode (cryptoCode) {
  if (!SUPPORTED_COINS.includes(cryptoCode)) {
    return Promise.reject(new Error('Unsupported crypto: ' + cryptoCode))
  }

  return Promise.resolve()
}

function balance (account, cryptoCode, settings, operatorId) {
  return axios.post('/balance', {
    account,
    cryptoCode,
    settings,
    operatorId
  }).catch(console.error)
}

function sendCoins (account, tx, settings, operatorId) {
  const { cryptoCode } = tx
  try {
    return checkCryptoCode(cryptoCode).then(() => {
      return axios.post('/sendCoins', {
        account,
        tx,
        settings,
        operatorId
      }).then(({ data }) => {
        if (data.error && data.error.message === 'insufficient funds') throw new E.InsufficientFundsError()
        else if (data.error) throw new Error({ error: data.error, message: data.error.message })
        const fee = BN(data.fee).round()
        const txid = data.txid
        return { txid, fee }
      })
    })
  } catch (e) {
    throw e
  }
}

function newAddress (account, info, tx, settings, operatorId) {
  return axios.post('/newAddress', {
    account,
    info,
    tx,
    settings,
    operatorId
  }).catch(console.error)
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
  return axios.post('/cryptoNetwork', {
    account,
    cryptoCode,
    settings,
    operatorId
  }).catch(console.error)
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
