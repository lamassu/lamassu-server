'use strict'

const querystring = require('querystring')
const axios = require('axios')
const crypto = require('crypto')
const _ = require('lodash/fp')

const API_ENDPOINT = 'https://api.itbit.com/v1'

let counter = -1
let lastTimestamp = Date.now()

function generateNonce () {
  const timestamp = Date.now()
  if (timestamp !== lastTimestamp) counter = -1
  lastTimestamp = timestamp
  counter = (counter + 1) % 1000
  return timestamp.toString() + counter.toString()
}

function authRequest (account, method, path, data) {
  if (!account.userId || !account.walletId || !account.clientKey || !account.clientSecret) {
    const err = new Error('Must provide user ID, wallet ID, client key, and client secret')
    return Promise.reject(err)
  }

  const url = buildURL(method, path, data)
  const dataString = method !== 'GET' && !_.isEmpty(data) ? JSON.stringify(data) : ''
  const nonce = generateNonce()
  const timestamp = Date.now()
  const message = nonce + JSON.stringify([method, url, dataString, nonce.toString(), timestamp.toString()])

  const hashBuffer = crypto
    .createHash('sha256')
    .update(message).digest()

  const bufferToHash = Buffer.concat([Buffer.from(url), hashBuffer])

  const signature = crypto
    .createHmac('sha512', Buffer.from(account.clientSecret))
    .update(bufferToHash)
    .digest('base64')

  return request(method, path, data, {
    'Authorization': account.clientKey + ':' + signature,
    'X-Auth-Timestamp': timestamp,
    'X-Auth-Nonce': nonce
  })
}

function request (method, path, data, auth) {
  const options = {
    method: method,
    url: buildURL(method, path, data),
    headers: {
      'User-Agent': 'Lamassu itBit node.js client',
      ...(auth)
    },
    ...(method !== 'GET' && {data: data})
  }

  return axios(options)
    .then(r => r.data)
    .catch(e => {
      var description = _.get(e, 'response.data.description')
      throw new Error(description || e.message)
    })
}

const cryptoCodeTranslations = { 'BTC': 'XBT', 'ETH': 'ETH' }
function buildMarket (fiatCode, cryptoCode) {
  const translatedCryptoCode = cryptoCodeTranslations[cryptoCode]
  if (!translatedCryptoCode) {
    throw new Error('Unsupported crypto: ' + cryptoCode)
  }

  if (!_.includes(fiatCode, ['USD', 'EUR', 'SGD'])) {
    throw new Error('Unsupported fiat: ' + fiatCode)
  }

  return translatedCryptoCode + fiatCode
}

function buildURL(method, path, data) {
  let url = API_ENDPOINT + path
  if (method === 'GET' && !_.isEmpty(data)) {
    url += '?' + querystring.stringify(data)
  }
  return url
}

module.exports = {authRequest, request, buildMarket}