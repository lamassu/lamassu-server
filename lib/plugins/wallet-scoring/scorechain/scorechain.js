const axios = require('axios')
const _ = require('lodash/fp')


const NAME = 'Scorechain'
const SUPPORTED_COINS = {
  BTC: 'BITCOIN',
  ETH: 'ETHEREUM',
  USDT: 'ETHEREUM',
  BCH: 'BITCOINCASH',
  LTC: 'LITECOIN',
  DASH: 'DASH',
  TRX: 'TRON',
  USDT_TRON: 'TRON'
}

const TYPE = {
  TRANSACTION: 'TRANSACTION',
  ADDRESS: 'ADDRESS'
}

function rate (account, objectType, cryptoCode, objectId) {
  return isWalletScoringEnabled(account, cryptoCode).then(isEnabled => {
    if (!isEnabled) return Promise.resolve(null)

    const threshold = account.scoreThreshold
    const payload = {
      analysisType: 'ASSIGNED',
      objectType,
      objectId,
      blockchain: SUPPORTED_COINS[cryptoCode],
      coin: "ALL"
    }

    const headers = {
      'accept': 'application/json',
      'X-API-KEY': account.apiKey,
      'Content-Type': 'application/json'
    }
    return axios.post(`https://api.scorechain.com/v1/scoringAnalysis`, payload, {headers})
      .then(res => {
        const resScore = res.data?.analysis?.assigned?.result?.score
        if (!resScore) throw new Error('Failed to get score from Scorechain API')

        // normalize score to 0-10 where 0 is the lowest risk
        return {score: (100 - resScore) / 10, isValid: resScore >= threshold}
      })
      .catch(err => {
        throw err
      })
  })
}

function rateTransaction (account, cryptoCode, transactionId) {
  return rate(account, TYPE.TRANSACTION, cryptoCode, transactionId)
}

function rateAddress (account, cryptoCode, address) {
  return rate(account, TYPE.ADDRESS, cryptoCode, address)
}

function isWalletScoringEnabled (account, cryptoCode) {
  const isAccountEnabled = !_.isNil(account) && account.enabled

  if (!isAccountEnabled) return Promise.resolve(false)

  if (!Object.keys(SUPPORTED_COINS).includes(cryptoCode)) {
    return Promise.reject(new Error('Unsupported crypto: ' + cryptoCode))
  }

  return Promise.resolve(true)
}

module.exports = {
  NAME,
  rateAddress,
  rateTransaction,
  isWalletScoringEnabled
}
