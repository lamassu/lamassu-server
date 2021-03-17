const axios_ = require('axios')
const https = require('https')

const URL = 'https://localhost:5555/api/'

const axios = axios_.create({
  baseURL: URL,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
})

function balance (account, cryptoCode, settings, operatorId) {
  return axios.post('/balance', {
    account,
    cryptoCode,
    settings,
    operatorId
  }).catch(console.error)
}

function sendCoins (account, tx, settings, operatorId) {
  return axios.post('/sendCoins', {
    account,
    tx,
    settings,
    operatorId
  }).catch(console.error)
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
