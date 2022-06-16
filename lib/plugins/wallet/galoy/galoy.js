
const _ = require('lodash/fp')
const invoice = require('@node-lightning/invoice')
const axios = require('axios')
const { utils: coinUtils } = require('@lamassu/coins')

const NAME = 'LN'
const SUPPORTED_COINS = ['LN', 'BTC']
const TX_PENDING = 'PENDING'
const TX_SUCCESS = 'SUCCESS'

const BN = require('../../../bn')

function request (graphqlQuery, token, endpoint) {
  const headers = {
    'content-type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
  return axios({
    method: 'post',
    url: endpoint,
    headers: headers,
    data: graphqlQuery
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

function getGaloyAccount (token, endpoint) {
  const accountInfo = {
    'operationName': 'me',
    'query': `query me {
      me {
        defaultAccount {
          defaultWalletId
          wallets {
            id
            walletCurrency
            balance
            transactions {
              edges {
                node {
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
      }
    }`,
    'variables': {}
  }
  return request(accountInfo, token, endpoint)
    .then(r => {
      return r.data.me.defaultAccount
    })
    .catch(err => {
      throw new Error(err)
    })
}

function isLightning (address) {
  return address.substr(0, 2) === 'ln'
}

function sendFundsOnChain (walletId, address, cryptoAtoms, token, endpoint) {
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
  return request(sendOnChain, token, endpoint)
    .then(result => {
      return result.data.onChainPaymentSend
    })
}

function sendFundsLN (walletId, invoice, token, endpoint) {
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
  return request(sendLN, token, endpoint)
    .then(result => {
      return result.data.lnInvoicePaymentSend
    })
}

function sendCoins (account, tx, settings, operatorId) {
  const { toAddress, cryptoAtoms, cryptoCode } = tx
  const externalCryptoCode = coinUtils.getExternalCryptoCode(cryptoCode)
  return checkCryptoCode(cryptoCode)
    .then(() => getGaloyAccount(account.apiKey, account.endpoint))
    .then(galoyAccount => {
      const wallet = _.head(
        _.filter(wallet => wallet.walletCurrency === externalCryptoCode &&
          wallet.id === galoyAccount.defaultWalletId &&
          wallet.id === account.walletId)(galoyAccount.wallets)
      )
      if (isLightning(toAddress)) {
        return sendFundsLN(wallet.id, toAddress, account.apiKey, account.endpoint)
      }
      return sendFundsOnChain(wallet.id, toAddress, cryptoAtoms, account.apiKey, account.endpoint)
    })
    .then(result => {
      switch (result.status) {
        case 'ALREADY_PAID':
          throw new Error('Transaction already exists!')
        case 'FAILURE':
          throw new Error('Transaction failed!')
        case 'SUCCESS':
          return '<galoy transaction>'
        case 'PENDING':
          return '<galoy transaction>'
        default:
          throw new Error(`Transaction failed: ${_.head(result.errors).message}`)
      }
    })
}

function newOnChainAddress (walletId, token, endpoint) {
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
  return request(createOnChainAddress, token, endpoint)
    .then(result => {
      return result.data.onChainAddressCreate.address
    })
}

function newInvoice (walletId, cryptoAtoms, token, endpoint) {
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
  return request(createInvoice, token, endpoint)
    .then(result => {
      return result.data.lnInvoiceCreate.invoice.paymentRequest
    })
}

function balance (account, cryptoCode, settings, operatorId) {
  const externalCryptoCode = coinUtils.getExternalCryptoCode(cryptoCode)
  return checkCryptoCode(cryptoCode)
    .then(() => getGaloyAccount(account.apiKey, account.endpoint))
    .then(galoyAccount => {
      // account has a list of wallets, should we consider the balance of each one?
      // for now we'll get the first BTC wallet that matches the defaultWalletId
      const wallet = _.head(
        _.filter(wallet => wallet.walletCurrency === externalCryptoCode &&
          wallet.id === galoyAccount.defaultWalletId &&
          wallet.id === account.walletId)(galoyAccount.wallets)
      )
      return new BN(wallet.balance || 0)
    })
}

function newAddress (account, info, tx, settings, operatorId) {
  const { cryptoAtoms, cryptoCode } = tx
  const externalCryptoCode = coinUtils.getExternalCryptoCode(cryptoCode)
  return checkCryptoCode(cryptoCode)
    .then(() => getGaloyAccount(account.apiKey, account.endpoint))
    .then(galoyAccount => {
      const wallet = _.head(
        _.filter(wallet => wallet.walletCurrency === externalCryptoCode &&
          wallet.id === galoyAccount.defaultWalletId &&
          wallet.id === account.walletId)(galoyAccount.wallets)
      )
      const promises = [
        newOnChainAddress(wallet.id, account.apiKey, account.endpoint),
        newInvoice(wallet.id, cryptoAtoms, account.apiKey, account.endpoint)
      ]
      return Promise.all(promises)
    })
    .then(([onChainAddress, invoice]) => {
      return `bitcoin:${onChainAddress}?amount=${cryptoAtoms}&lightning=${invoice}`
    })
}

function getStatus (account, tx, requested, settings, operatorId) {
  const { toAddress, cryptoAtoms, cryptoCode } = tx
  const mapStatus = tx => {
    if (!tx) return 'notSeen'
    if (tx.node.status === TX_PENDING) return 'authorized'
    if (tx.node.status === TX_SUCCESS) return 'confirmed'
    return 'notSeen'
  }
  const externalCryptoCode = coinUtils.getExternalCryptoCode(cryptoCode)
  return checkCryptoCode(cryptoCode)
    .then(() => getGaloyAccount(account.apiKey, account.endpoint))
    .then(galoyAccount => {
      const wallet = _.head(
        _.filter(wallet => wallet.walletCurrency === externalCryptoCode &&
          wallet.id === galoyAccount.defaultWalletId &&
          wallet.id === account.walletId)(galoyAccount.wallets)
      )
      const transactions = wallet.transactions.edges
      const address = coinUtils.parseUrl(cryptoCode, account.environment, toAddress)
      if (isLightning(address)) {
        const paymentHash = invoice.decode(address).paymentHash.toString('hex')
        const transaction = _.head(_.filter(tx => tx.node.initiationVia.paymentHash === paymentHash && tx.node.direction === 'RECEIVE')(transactions))
        return { receivedCryptoAtoms: cryptoAtoms, status: mapStatus(transaction) }
      }
      // On-chain tx
      const transaction = _.head(_.filter(tx => tx.node.initiationVia.address === address)(transactions))
      return { receivedCryptoAtoms: cryptoAtoms, status: mapStatus(transaction) }
    })
}

function newFunding (account, cryptoCode, settings, operatorId) {
  const externalCryptoCode = coinUtils.getExternalCryptoCode(cryptoCode)
  // Regular BTC address
  return checkCryptoCode(cryptoCode)
    .then(() => getGaloyAccount(account.apiKey, account.endpoint))
    .then(galoyAccount => {
      const wallet = _.head(
        _.filter(wallet => wallet.walletCurrency === externalCryptoCode &&
          wallet.id === galoyAccount.defaultWalletId &&
          wallet.id === account.walletId)(galoyAccount.wallets)
      )
      const pendingBalance = _.sumBy(tx => {
        if (tx.node.status === TX_PENDING) return tx.node.settlementAmount
        return 0
      })(wallet.transactions.edges)
      return newOnChainAddress(wallet.id, account.apiKey, account.endpoint)
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
