const { AML } = require('elliptic-sdk')
const _ = require('lodash/fp')

const NAME = 'Elliptic'

const HOLLISTIC_COINS = {
  BTC: 'BTC',
  ETH: 'ETH',
  USDT: 'USDT',
  USDT_TRON: 'USDT',
  LTC: 'LTC',
  TRX: 'TRX'
}

const SINGLE_ASSET_COINS = {
  ZEC: {
    asset: 'ZEC',
    blockchain: 'zcash'
  },
  BCH: {
    asset: 'BCH',
    blockchain: 'bitcoin_cash'
  }
}

const TYPE = {
    TRANSACTION: 'transaction',
    ADDRESS: 'address'
}

const SUPPORTED_COINS = { ...HOLLISTIC_COINS, ...SINGLE_ASSET_COINS }

function rate (account, objectType, cryptoCode, objectId) {
  return isWalletScoringEnabled(account, cryptoCode).then(isEnabled => {
    if (!isEnabled) return Promise.resolve(null)

    const aml = new AML({
      key: account.apiKey,
      secret: account.apiSecret
    })

    const isHolistic = Object.keys(HOLLISTIC_COINS).includes(cryptoCode)

    const requestBody = {
      subject: {
        asset: isHolistic ? 'holistic' : SINGLE_ASSET_COINS[cryptoCode].asset,
        blockchain: isHolistic ? 'holistic' : SINGLE_ASSET_COINS[cryptoCode].blockchain,
        type: objectType,
        hash: objectId
      },
      type: objectType === TYPE.ADDRESS ? 'wallet_exposure' : 'source_of_funds'
    }

    const threshold = account.scoreThreshold
    const endpoint = objectType === TYPE.ADDRESS ? '/v2/wallet/synchronous' : '/v2/analysis/synchronous'

    return aml.client
        .post(endpoint, requestBody)
        .then((res) => {
          const resScore = res.data?.risk_score

          // elliptic returns 0-1 score, but we're accepting 0-100 config
          // normalize score to 0-10 where 0 is the lowest risk
          // elliptic score can be null and contains decimals
          return {score: (resScore || 0) * 10, isValid: ((resScore || 0) * 100) < threshold}
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
