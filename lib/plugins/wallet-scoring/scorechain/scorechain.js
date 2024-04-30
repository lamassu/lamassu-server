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
  if (_.isNil(account) || !account.enabled || !Object.keys(SUPPORTED_COINS).includes(cryptoCode)) return Promise.resolve(null)

  const threshold = account.scoreThreshold
  const payload = {
    analysisType: 'ASSIGNED',
    objectType,
    objectId,
    blockchain: SUPPORTED_COINS[cryptoCode],
    coin: "ALL"
  }

  return axios.post(`https://api.scorechain.com/v1/scoringAnalysis`, payload, { headers: { 'X-API-KEY': account.apiKey }
  })
    .then(res => {
      const resScore = res.data?.analysis?.assigned?.result?.score
      if (!resScore) throw new Error('Failed to get score from Scorechain API')

      // normalize score to 0-10 where 0 is the highest risk
      // use 101 instead of 100 to avoid division by zero
      return { score: (101 - resScore) / 10 - 0.1, isValid: resScore >= threshold }
    })
    .catch(err => {
      throw err
    })
}

function rateTransaction (account, cryptoCode, transactionId) {
  rate(account, TYPE.TRANSACTION, cryptoCode, transactionId)
}

function rateAddress (account, cryptoCode, address) {
  rate(account, TYPE.ADDRESS, cryptoCode, address)
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
