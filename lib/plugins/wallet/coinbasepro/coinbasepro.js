const _ = require('lodash/fp')
const axios = require('axios')
const crypto = require('crypto')
const ticker = require('../../../ticker')
const settingsLoader = require('../../../new-settings-loader')
const { utils: coinUtils } = require('@lamassu/coins')

const BN = require('../../../bn')
const E = require('../../../error')

const SUPPORTED_COINS = ['BTC', 'BCH', 'DASH', 'ETH', 'LTC', 'USDT', 'ZEC']

const API_URL = 'https://api.exchange.coinbase.com'

function request (options, account) {
  // create the json request object
  const cbAccessTimestamp = Date.now() / 1000 // in ms
  const method = options.method
  const requestPath = options.path
  const body = _.defaultTo('', JSON.stringify(options.body))

  // create the prehash string by concatenating required parts
  const message = cbAccessTimestamp + method + requestPath + body

  // decode the base64 secret
  const secret = Buffer.from(account.apiSecret, 'base64')

  // create a sha256 hmac with the secret
  const hmac = crypto.createHmac('sha256', secret)

  // sign the require message with the hmac and base64 encode the result
  const cbAccessSign = hmac.update(message).digest('base64')
  const headers = {
    'content-type': 'application/json',
    'cb-access-key': account.apiKey,
    'cb-access-sign': cbAccessSign,
    'cb-access-timestamp': cbAccessTimestamp,
    'cb-access-passphrase': account.passphrase
  }
  const config = {
    baseURL: API_URL,
    url: requestPath,
    method,
    headers,
    body: options.body
  }
  return axios(config)
    .then(res => res.data)
    .catch(err => console.error('Error: ' + err.message))
}

function balance (account, cryptoCode, settings, operatorId) {
  return checkCryptoCode(cryptoCode)
    .then(() => getWallet(account, cryptoCode))
    .then(_.get('balance'))
}

function newAddress (account, info, tx, settings, operatorId) {
  return checkCryptoCode(info.cryptoCode)
    .then(() => getWallet(account, info.cryptoCode))
    .then(wallet => {
      return request({
        path: `/coinbase-accounts/${wallet.id}/addresses`,
        method: 'POST'
      }, account)
        .then(_.get('address'))
    })
}

function convertPendingBalance (ratesRec, balance, cryptoCode) { 
      const rates = ratesRec.rates
      const rate = (rates.ask.plus(rates.bid)).div(2)
      const cryptoRec = coinUtils.getCryptoCurrency(cryptoCode)
      const unitScale = cryptoRec.unitScale
      const baseUnits = new BN(1).shiftedBy(unitScale)
      const result = baseUnits.times(balance).div(rate)
      return result
}

function getRates(fiatCode, cryptoCode) {
  return settingsLoader.loadLatest().then(settings => ticker.getRates(settings, fiatCode, cryptoCode))
}

function newFunding (account, cryptoCode, fiatCode, settings, operatorId) {
  return checkCryptoCode(cryptoCode)
    .then(() => {
      const promises = [
        getWallet(account, cryptoCode),
        newAddress(account, { cryptoCode }),
        getRates(fiatCode, cryptoCode)
      ]
      return Promise.all(promises)
    })
    .then(([wallet, fundingAddress, ratesRec]) => ({
      fundingConfirmedBalance: new BN(wallet.balance),
      fundingPendingBalance: convertPendingBalance(ratesRec, new BN(wallet['hold_balance']), cryptoCode),
      fundingAddress
    }))
}

function sendCoins (account, tx, settings, operatorId) {
  const { toAddress, cryptoAtoms, cryptoCode } = tx
  return checkCryptoCode(cryptoCode)
    .then(() => {
      const body = {
        crypto_address: toAddress,
        amount: cryptoAtoms.toNumber(),
        currency: cryptoCode
      }
      return request({
        path: '/withdrawals/crypto',
        method: 'POST',
        body
      }, account)
    })
    .then(result => {
      let fee = parseFloat(result.fee)
      let txid = result.id

      return { txid: txid, fee: new BN(fee).decimalPlaces(0) }
    })
    .catch(err => {
      if (err.message === 'insufficient funds') throw new E.InsufficientFundsError()
      throw err
    })
}

function getStatus () {
  return Promise.reject('Cash-out not supported!')
}

function getWallet (account, cryptoCode) {
  return request({ path: '/coinbase-accounts', method: 'GET' }, account)
    .then(res => _.find(it => it.currency === cryptoCode)(res))
}

function checkCryptoCode (cryptoCode) {
  if (!SUPPORTED_COINS.includes(cryptoCode)) {
    return Promise.reject(new Error('Unsupported crypto: ' + cryptoCode))
  }

  return Promise.resolve()
}

function checkBlockchainStatus (cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => Promise.resolve('ready'))
}

function cryptoNetwork (account, cryptoCode, settings, operatorId) {
  return checkCryptoCode(cryptoCode)
    .then('main')
}

module.exports = {
  balance,
  sendCoins,
  newAddress,
  getStatus,
  newFunding,
  cryptoNetwork,
  checkBlockchainStatus
}
