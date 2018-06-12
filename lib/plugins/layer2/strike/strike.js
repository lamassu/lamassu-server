const axios = require('axios')
const _ = require('lodash/fp')

const options = require('../../../options')

module.exports = {
  newAddress,
  getStatus,
  cryptoNetwork
}

axios.defaults.baseURL = _.get('strike.baseUrl', options)
if (_.isEmpty(axios.defaults.baseURL)) {
  throw new Error('Missing Strike baseUrl!')
}

function cryptoNetwork (account, cryptoCode) {
  return Promise.resolve('test')
}

function checkCryptoCode (cryptoCode) {
  if (cryptoCode !== 'BTC') return Promise.reject(new Error('Unsupported crypto: ' + cryptoCode))
  return Promise.resolve()
}

function getCharge (account, chargeId) {
  return axios({
    method: 'get',
    url: `v1/charges/${chargeId}`,
    auth: {username: account.token, password: ''}
  }).then(_.get('data'))
}

function createCharge (account, info) {
  const data = {
    amount: info.cryptoAtoms.toNumber(),
    currency: 'btc',
    description: 'Lamassu cryptomat cash-out'
  }
  const token = _.get('token', account)
  if (_.isEmpty(token)) {
    return Promise.reject(new Error('Missing Strike account token!'))
  }

  return axios({
    method: 'post',
    url: 'v1/charges',
    auth: {
      username: token,
      password: ''
    },
    data
  }).then(_.get('data'))
}

function newAddress (account, info) {
  return checkCryptoCode(info.cryptoCode)
    .then(() => createCharge(account, info))
    .then(r => `strike:${r.id}:${r.payment_hash}:${r.payment_request}`)
}

function getStatus (account, toAddress, requested, cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => {
      const parts = _.split(':', toAddress)
      const chargeId = parts[1]

      return getCharge(account, chargeId)
        .then(r => ({status: r.paid ? 'confirmed' : 'notSeen'}))
    })
}
