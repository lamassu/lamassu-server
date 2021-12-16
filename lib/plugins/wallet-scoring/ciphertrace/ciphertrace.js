const axios = require('axios')
const _ = require('lodash/fp')

const { WALLET_SCORE_THRESHOLD } = require('../../../constants')

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
    "Authorization": account
  }
  return { apiVersion, authHeader }
}

function rateWallet(account, cryptoCode, address) {
  const client = getClient(account)
  console.log('client', client)
  if (!_.includes(_.toUpper(cryptoCode), SUPPORTED_COINS) || _.isNil(client)) return Promise.resolve(null)

  const { apiVersion, authHeader } = client
  const score = Math.floor(Math.random() * (10 - 1 + 1)) + 1
  const threshold = _.isNil(account.scoreThreshold) ? WALLET_SCORE_THRESHOLD : account.scoreThreshold
  return Promise.resolve({ address, score, isValid: score < threshold })

  // return axios.get(`https://rest.ciphertrace.com/aml/${apiVersion}/${_.toLower(cryptoCode)}/risk?address=${address}`, {
  //   headers: authHeader
  // })
  //   .then(res => ({ address, score: res.risk, isValid: res.risk <= SCORE_THRESHOLD }))
}

function isValidWalletScore(account, score) {
  const client = getClient(account)
  if (_.isNil(client)) return Promise.resolve(true)

  const threshold = _.isNil(account) ? WALLET_SCORE_THRESHOLD : account.scoreThreshold
  return Promise.resolve(score < threshold)
}

module.exports = {
  NAME,
  rateWallet,
  isValidWalletScore
}
