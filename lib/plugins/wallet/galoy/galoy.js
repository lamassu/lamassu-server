
const _ = require('lodash/fp')

const axios = require('axios')
const NAME = 'LN'
const SUPPORTED_COINS = ['LN']
const PHONE = '+3500000000000'

const URI = 'https://api.staging.galoy.io/graphql'

const BN = require('../../../bn')

function request (graphqlQuery, token) {
  const headers = {
    'content-type': 'application/json',
    'Authorization': token || ''
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
      console.log(r)
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
          ...AccountFragment
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
      return r.data.data.defaultAccount
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
          ...ErrorFragment
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
          ...ErrorFragment
        }
        result {
          ...CaptchaCreateChallengeResultFragment
        }
      }
    }`,
    'variables': {}
  }
  const captchaRequestAuthCode = {
    'operationName': 'captchaRequestAuthCode',
    'query': `mutation captchaRequestAuthCode($input: CaptchaRequestAuthCodeInput!) {
      captchaRequestAuthCode(input: $input) {
        errors {
          ...ErrorFragment
        }
        success
      }
    }`,
    'variables': {}
  }

  return request(regularRequestAuthCode)
    .then(r => {
      console.log(r)
      return r
    })
}

function isLightning (address) {
  return address.substr(0, 2) === 'ln'
}

function sendCoins (account, tx, settings, operatorId) {
  const { toAddress, cryptoAtoms, cryptoCode } = tx
  // Is walletId a mandatory field?
  const sendOnChain = {
    'operationName': 'onChainPaymentSend',
    'query': `mutation onChainPaymentSend($input: OnChainPaymentSendInput!) {
      onChainPaymentSend(input: $input) {
        errors {
          ...ErrorFragment
        }
        status
      }
    }`,
    'variables': { 'input': { 'address': `${toAddress}`, 'amount': `${cryptoAtoms}` } }
  }
  const sendLN = {
    'operationName': 'lnInvoicePaymentSend',
    'query': `mutation lnInvoicePaymentSend($input: LnInvoicePaymentInput!) {
      lnInvoicePaymentSend(input: $input) {
        errors {
          ...ErrorFragment
        }
        status
      }
    }`,
    'variables': { 'input': { 'paymentRequest': `${toAddress}` } }
  }
  return checkCryptoCode(cryptoCode)
    .then(() => fetchAuthToken({ phone: PHONE }))
    .then(authToken => {
      if (isLightning) {
        return request(sendLN, authToken)
      }
      return request(sendOnChain, authToken)
    })
    .then(result => {
      return result.data
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
          ...ErrorFragment
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
          ...ErrorFragment
        }
        invoice {
          ...LnInvoiceFragment
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
    .then(() => fetchAuthToken({ phone: PHONE }))
    .then(authToken => getGaloyAccount(authToken))
    .then(account => {
      // account has a list of wallets, should we consider the balance of each one?
      // for now we'll pick the first BTC wallet that matches the defaultWalletId
      const wallet = _.filter(wallet => wallet.walletCurrency === cryptoCode && wallet.id === account.defaultWalletId)(account.wallets)
      return new BN(wallet.balance || 0)
    })
    .catch(err => {
      throw err
    })
}

function newAddress (account, info, tx, settings, operatorId) {
  const { cryptoAtoms, cryptoCode } = tx
  return checkCryptoCode(info.cryptoCode)
    .then(() => fetchAuthToken({ phone: PHONE }))
    .then(authToken => [getGaloyAccount(authToken), authToken])
    .then(([account, authToken]) => {
      const wallet = _.filter(wallet => wallet.walletCurrency === cryptoCode && wallet.id === account.defaultWalletId)(account.wallets)
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
    .then(() => fetchAuthToken({ phone: PHONE }))
    .then(authToken => [getGaloyAccount(authToken), authToken])
    .then(([account, authToken]) => {
      const wallet = _.filter(wallet => wallet.walletCurrency === cryptoCode && wallet.id === account.defaultWalletId)(account.wallets)
      return newOnChainAddress(wallet.id, authToken)
        .then(onChainAddress => [onChainAddress, wallet.balance])
    })
    .then(([onChainAddress, balance]) => {
      // Missing pending balance
      return {
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

sendCoins({}, {
  toAddress: 'lnbc10n1p3z7tpkpp5fjkptx4xtnh5n5vyrrhrw25f86mv0rwyu9a8tm3lrwnkl4u58zqdqg23jhxap3cqzpgxqyz5vqsp5g239kch2r7q9dty8rgs2h94h0d6tp8ssws9zte9qzvss2fr729zs9qyyssq86khhqz86dhftteqd0ymad32dfrdfdmdac8jw359wn4s0fx5gfyrectl4e49pt38gculfk3xeljv5ygd8ddry0m0z38lqt23j8aytycqrd4med',
  cryptoCode: 'LN',
  cryptoAtoms: 123123
}, {}, {})

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
