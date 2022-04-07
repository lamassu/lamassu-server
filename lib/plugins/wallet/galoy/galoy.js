
const _ = require('lodash/fp')

const axios = require('axios')
const NAME = 'LN'
const SUPPORTED_COINS = ['LN', 'BTC']
const TX_PENDING = 'PENDING'

const URI = 'https://api.staging.galoy.io/graphql'

const BN = require('../../../bn')

function request (graphqlQuery, token) {
  const headers = {
    'content-type': 'application/json',
    'Authorization': `Bearer ${token || TEST_AUTH_TOKEN}`
  }
  return Promise.resolve(true)
    .then(() => {
      return axios({
        method: 'post',
        url: URI,
        headers: headers,
        data: graphqlQuery
      })
    })
    .then(r => {
      if (r.error) throw r.error
      return r.data
    })
    .catch(err => {
      throw new Error(err)
    })
}

function checkCryptoCode (cryptoCode) {
  if (!SUPPORTED_COINS.includes(cryptoCode)) {
    return Promise.reject(new Error('Unsupported crypto: ' + cryptoCode))
  }

  return Promise.resolve()
}

function getGaloyAccount (token) {
  const accountInfo = {
    'operationName': 'me',
    'query': `query me {
      me {
        createdAt
        defaultAccount {
          defaultWalletId
          wallets {
            id
            walletCurrency
            balance
            transactions {
              edges {
                node {
                  createdAt
                  direction
                  id
                  settlementAmount
                  settlementFee
                  status
                  initiationVia {
                    ... on InitiationViaIntraLedger {
                      counterPartyUsername
                      counterPartyWalletId
                    }
                    ... on InitiationViaLn {
                      paymentHash
                    }
                    ... on InitiationViaOnChain {
                      address
                    }
                  }
                  settlementVia { 
                    ... on SettlementViaIntraLedger {
                      counterPartyUsername
                      counterPartyWalletId
                    }
                    ... on SettlementViaLn {
                      preImage
                    }
                    ... on SettlementViaOnChain {
                      transactionHash
                    }
                  }
                }
              }
            }
          }
        }
        id
        phone
        twoFAEnabled
        username
      }
    }`,
    'variables': {}
  }
  return request(accountInfo, token)
    .then(r => {
      return r.data.me.defaultAccount
    })
    .catch(err => {
      throw new Error(err)
    })
}

function fetchAuthToken (config) {
  const phone = config.phone
  // userRequestAuthCode deprecated?
  const regularRequestAuthCode = {
    'operationName': 'userRequestAuthCode',
    'query': `mutation userRequestAuthCode($input: UserRequestAuthCodeInput!) {
      userRequestAuthCode(input: $input) {
        errors {
          message
          path
        }
        success
      }
    }`,
    'variables': { 'input': { 'phone': `${phone}` } }
  }
  const createCaptcha = {
    'operationName': 'captchaCreateChallenge',
    'query': `mutation captchaCreateChallenge {
      captchaCreateChallenge {
        errors {
          message
          path
        }
        result {
          challengeCode
          id
        }
      }
    }`,
    'variables': {}
  }
  const captchaRequestAuthCode = code => ({
    'operationName': 'captchaRequestAuthCode',
    'query': `mutation captchaRequestAuthCode($input: CaptchaRequestAuthCodeInput!) {
      captchaRequestAuthCode(input: $input) {
        errors {
          message
          path
        }
        success
      }
    }`,
    'variables': { 'input': { 'phone': `${phone}`, 'challengeCode': `${code.challengeCode}`, 'secCode': `${code.challengeCode.slice(0, 5)}`, 'validationCode': `${code.challengeCode.slice(0, 5)}` } }
  })

  return request(createCaptcha)
    .then(r => {
      const code = r.data.captchaCreateChallenge.result
      if (code) {
        // captchaRequestAuthCode parameters have to be processed by geetest
        return request(captchaRequestAuthCode(code))
      }
    })
    .catch(err => {
      throw new Error(err)
    })
}

function isLightning (address) {
  return address.substr(0, 2) === 'ln'
}

function sendFundsOnChain (walletId, address, cryptoAtoms, token) {
  const sendOnChain = {
    'operationName': 'onChainPaymentSend',
    'query': `mutation onChainPaymentSend($input: OnChainPaymentSendInput!) {
      onChainPaymentSend(input: $input) {
        errors {
          message
          path
        }
        status
      }
    }`,
    'variables': { 'input': { 'address': `${address}`, 'amount': `${cryptoAtoms}`, 'walletId': `${walletId}` } }
  }
  return request(sendOnChain, token)
    .then(result => {
      return result.data.onChainPaymentSend
    })
    .catch(err => {
      throw err
    })
}

function sendFundsLN (walletId, invoice, token) {
  const sendLN = {
    'operationName': 'lnInvoicePaymentSend',
    'query': `mutation lnInvoicePaymentSend($input: LnInvoicePaymentInput!) {
      lnInvoicePaymentSend(input: $input) {
        errors {
          message
          path
        }
        status
      }
    }`,
    'variables': { 'input': { 'paymentRequest': `${invoice}`, 'walletId': `${walletId}` } }
  }
  return request(sendLN, token)
    .then(result => {
      return result.data.lnInvoicePaymentSend
    })
    .catch(err => {
      throw err
    })
}

function sendCoins (account, tx, settings, operatorId) {
  const { toAddress, cryptoAtoms, cryptoCode } = tx
  return checkCryptoCode(cryptoCode)
    // .then(() => fetchAuthToken({ phone: PHONE }))
    .then(authToken => Promise.all([getGaloyAccount(authToken), authToken]))
    .then(([account, authToken]) => {
      const wallet = _.head(_.filter(wallet => wallet.walletCurrency === cryptoCode && wallet.id === account.defaultWalletId)(account.wallets))
      if (isLightning(toAddress)) {
        return sendFundsLN(wallet.id, toAddress, authToken)
      }
      return sendFundsOnChain(wallet.id, toAddress, cryptoAtoms, authToken)
    })
    .then(result => {
      return result
    })
    .catch(err => {
      throw err
    })
}

function newOnChainAddress (walletId, token) {
  const createOnChainAddress = {
    'operationName': 'onChainAddressCreate',
    'query': `mutation onChainAddressCreate($input: OnChainAddressCreateInput!) {
      onChainAddressCreate(input: $input) {
        address
        errors {
          message
          path
        }
      }
    }`,
    'variables': { 'input': { 'walletId': `${walletId}` } }
  }
  return request(createOnChainAddress, token)
    .then(result => {
      return result.data.onChainAddressCreate.address
    })
    .catch(err => {
      throw err
    })
}

function newInvoice (walletId, cryptoAtoms, token) {
  const createInvoice = {
    'operationName': 'lnInvoiceCreate',
    'query': `mutation lnInvoiceCreate($input: LnInvoiceCreateInput!) {
      lnInvoiceCreate(input: $input) {
        errors {
          message
          path
        }
        invoice {
          paymentRequest
        }
      }
    }`,
    'variables': { 'input': { 'walletId': `${walletId}`, 'amount': `${cryptoAtoms}` } }
  }
  return request(createInvoice, token)
    .then(result => {
      return result.data.lnInvoiceCreate.invoice.paymentRequest
    })
    .catch(err => {
      throw err
    })
}

function balance (account, cryptoCode, settings, operatorId) {
  return checkCryptoCode(cryptoCode)
    // .then(() => fetchAuthToken({ phone: PHONE }))
    .then(authToken => getGaloyAccount(authToken))
    .then(account => {
      console.log(account)
      // account has a list of wallets, should we consider the balance of each one?
      // for now we'll pick the first BTC wallet that matches the defaultWalletId
      const wallet = _.head(_.filter(wallet => wallet.walletCurrency === cryptoCode && wallet.id === account.defaultWalletId)(account.wallets))
      console.log(wallet)
      return new BN(wallet.balance || 0)
    })
    .catch(err => {
      throw err
    })
}

function newAddress (account, info, tx, settings, operatorId) {
  const { cryptoAtoms, cryptoCode } = tx
  return checkCryptoCode(cryptoCode)
    // .then(() => fetchAuthToken({ phone: PHONE }))
    .then(authToken => Promise.all([getGaloyAccount(authToken), authToken]))
    .then(([account, authToken]) => {
      const wallet = _.head(_.filter(wallet => wallet.walletCurrency === cryptoCode && wallet.id === account.defaultWalletId)(account.wallets))
      const promises = [
        newOnChainAddress(wallet.id, authToken),
        newInvoice(wallet.id, cryptoAtoms, authToken)
      ]
      return Promise.all(promises)
    })
    .then(([onChainAddress, invoice]) => {
      return `bitcoin:${onChainAddress}?amount=${cryptoAtoms}?lightning=${invoice}`
    })
}

function getStatus (account, tx, requested, settings, operatorId) {
  // Type Transaction has a field status
  // but we're not sure if it's interchangeable with our status definition
}

function newFunding (account, cryptoCode, settings, operatorId) {
  // Has to be a regular BTC address
  return checkCryptoCode(cryptoCode)
    // .then(() => fetchAuthToken({ phone: PHONE }))
    .then(authToken => Promise.all([getGaloyAccount(authToken), authToken]))
    .then(([account, authToken]) => {
      const wallet = _.head(_.filter(wallet => wallet.walletCurrency === cryptoCode && wallet.id === account.defaultWalletId)(account.wallets))
      const pendingBalance = _.sumBy(tx => {
        if (tx.node.status === TX_PENDING) return tx.node.settlementAmount
        return 0
      })(wallet.transactions.edges)
      return newOnChainAddress(wallet.id, authToken)
        .then(onChainAddress => [onChainAddress, wallet.balance, pendingBalance])
    })
    .then(([onChainAddress, balance, pendingBalance]) => {
      return {
        fundingPendingBalance: new BN(pendingBalance),
        fundingConfirmedBalance: new BN(balance),
        fundingAddress: onChainAddress
      }
    })
}

function cryptoNetwork (account, cryptoCode, settings, operatorId) {
  return checkCryptoCode(cryptoCode)
    .then(() => account.environment === 'test' ? 'test' : 'main')
}

function checkBlockchainStatus (cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => Promise.resolve('ready'))
}

// sendCoins({}, {
//   toAddress: 'tb1ql7w62elx9ucw4pj5lgw4l028hmuw80sndtntxt',
//   cryptoCode: 'BTC',
//   cryptoAtoms: 1000
// }, {}, {})
//   .then(r => console.log(r))

// balance({}, 'BTC', {}, {})
//   .then(r => console.log())
// getGaloyAccount()
// newAddress({}, {}, { cryptoCode: 'BTC', cryptoAtoms: 1 }, {})
//   .then(r => console.log(r))

// Test faucet addresses
// tb1qfyt7cgds7z8ssthtnhh35s608059yzk0hwgcqd 1)
// tb1qmflph389nz5ev05jypzvcglyguyrl2qhyaag6r 2)

module.exports = {
  NAME,
  balance,
  sendCoins,
  newAddress,
  getStatus,
  newFunding,
  cryptoNetwork,
  checkBlockchainStatus
}
