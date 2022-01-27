const axios = require('axios')
const _ = require('lodash/fp')

const NAME = 'CipherTrace'
const SUPPORTED_COINS = ['BTC', 'ETH', 'BCH', 'LTC', 'BNB', 'RSK']

function getClient(account) {
  if (_.isNil(account) || !account.enabled) return null

  const [ctv1, username, secretKey] = account.authorizationValue.split(':')
  if (_.isNil(ctv1) || _.isNil(username) || _.isNil(secretKey)) {
    throw new Error('Invalid CipherTrace configuration')
  }

  const apiVersion = ctv1.slice(-2)
  const authHeader = {
    "Authorization": account.authorizationValue
  }
  return { apiVersion, authHeader }
}

function rateWallet(account, cryptoCode, address) {
  const client = getClient(account)
  if (!_.includes(_.toUpper(cryptoCode), SUPPORTED_COINS) || _.isNil(client)) return Promise.resolve(null)

  const { apiVersion, authHeader } = client
  const threshold = account.scoreThreshold

  return axios.get(`https://rest.ciphertrace.com/aml/${apiVersion}/${_.toLower(cryptoCode)}/risk?address=${address}`, {
    headers: authHeader
  })
    .then(res => ({ address, score: res.data.risk, isValid: res.data.risk < threshold }))
}

function isValidWalletScore(account, score) {
  const client = getClient(account)
  if (_.isNil(client)) return Promise.resolve(true)

  const threshold = account.scoreThreshold
  return Promise.resolve(score < threshold)
}

module.exports = {
  NAME,
  rateWallet,
  isValidWalletScore
}
