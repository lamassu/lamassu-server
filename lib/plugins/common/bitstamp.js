'use strict'

const querystring = require('querystring')
const axios = require('axios')
const crypto = require('crypto')
const _ = require('lodash/fp')

const API_ENDPOINT = 'https://www.bitstamp.net/api/v2'

let counter = -1
let lastTimestamp = Date.now()

function pad (num) {
  const asString = num.toString(10)
  if (num < 10) return '00' + asString
  if (num < 100) return '0' + asString
  return asString
}

function generateNonce () {
  const timestamp = Date.now()
  if (timestamp !== lastTimestamp) counter = -1
  lastTimestamp = timestamp
  counter = (counter + 1) % 1000
  return timestamp.toString(10) + pad(counter)
}

function authRequest (config, path, data) {
  if (!config.key || !config.secret || !config.clientId) {
    const err = new Error('Must provide key, secret and client ID')
    return Promise.reject(err)
  }

  data = data || {}

  const nonce = generateNonce()
  const msg = [nonce, config.clientId, config.key].join('')

  const signature = crypto
    .createHmac('sha256', Buffer.from(config.secret))
    .update(msg)
    .digest('hex')
    .toUpperCase()

  const signedData = _.merge(data, {
    key: config.key,
    signature: signature,
    nonce: nonce
  })

  return request(path, 'POST', signedData)
}

function buildMarket (fiatCode, cryptoCode) {
  if (!_.includes(cryptoCode, ['BTC', 'ETH', 'LTC', 'BCH'])) {
    throw new Error('Unsupported crypto: ' + cryptoCode)
  }

  if (!_.includes(fiatCode, ['USD', 'EUR'])) {
    throw new Error('Unsupported fiat: ' + fiatCode)
  }

  return `${cryptoCode.toLowerCase()}${fiatCode.toLowerCase()}`
}

function request (path, method, data) {
  const options = {
    method: method,
    url: API_ENDPOINT + path + '/',
    headers: {
      'User-Agent': 'Mozilla/4.0 (compatible; Lamassu client)',
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }

  if (data) options.data = querystring.stringify(data)

  return axios(options)
    .then(r => r.data)
}

module.exports = {
  authRequest,
  request,
  buildMarket
}
