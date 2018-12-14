'use strict'

const Web3 = require('web3')
const web3 = new Web3()
const hdkey = require('ethereumjs-wallet/hdkey')
const Tx = require('ethereumjs-tx')
const util = require('ethereumjs-util')
const pify = require('pify')
const BN = require('../../../bn')

const NAME = 'geth'
exports.SUPPORTED_MODULES = ['wallet']

const paymentPrefixPath = "m/44'/60'/0'/0'"
const defaultPrefixPath = "m/44'/60'/1'/0'"

module.exports = {
  NAME,
  balance,
  sendCoins,
  newAddress,
  getStatus,
  sweep,
  defaultAddress,
  supportsHd: true,
  newFunding,
  privateKey,
  isStrictAddress,
  connect
}

function connect (url) {
  if (!web3.isConnected()) {
    web3.setProvider(new web3.providers.HttpProvider(url))
  }
}

const hex = bigNum => '0x' + bigNum.truncated().toString(16)

function privateKey (account) {
  return defaultWallet(account).getPrivateKey()
}

function isStrictAddress (cryptoCode, toAddress) {
  return cryptoCode === 'ETH' && util.isValidChecksumAddress(toAddress)
}

function sendCoins (account, toAddress, cryptoAtoms, cryptoCode) {
  return generateTx(toAddress, defaultWallet(account), cryptoAtoms, false)
    .then(pify(web3.eth.sendRawTransaction))
    .then(r => {
      return pify(web3.eth.getTransactionByHash)(r.result)
        .then(tx => {
          if (!tx) return { txid: r.result }

          const fee = BN(tx.gas).multipliedBy(BN(tx.gasPrice)).round()

          return { txid: r.result, fee }
        })
    })
}

function checkCryptoCode (cryptoCode) {
  if (cryptoCode === 'ETH') return Promise.resolve()
  return Promise.reject(new Error('cryptoCode must be ETH'))
}

function balance (account, cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => pendingBalance(defaultAddress(account)))
}

const pendingBalance = address => _balance(true, address)
const confirmedBalance = address => _balance(false, address)

function _balance (includePending, address) {
  const block = includePending ? 'pending' : undefined

  return pify(web3.eth.getBalance)(address.toLowerCase(), block)
}

function generateTx (_toAddress, wallet, amount, includesFee) {
  const fromAddress = '0x' + wallet.getAddress().toString('hex')
  const toAddress = _toAddress.toLowerCase()

  const txTemplate = {
    from: fromAddress,
    to: toAddress,
    value: amount
  }

  const promises = [
    pify(web3.eth.estimateGas)(txTemplate),
    pify(web3.eth.getGasPrice)(),
    pify(web3.eth.getTransactionCount)(fromAddress)
  ]

  return Promise.all(promises)
    .then(arr => {
      const gas = arr[0]
      const gasPrice = arr[1]
      const txCount = arr[2]

      const toSend = includesFee
        ? amount.minus(gasPrice.times(gas))
        : amount

      const rawTx = {
        nonce: txCount,
        gasPrice: hex(gasPrice),
        gasLimit: gas,
        to: toAddress,
        from: fromAddress,
        value: hex(toSend)
      }

      const tx = new Tx(rawTx)
      const privateKey = wallet.getPrivateKey()

      tx.sign(privateKey)

      return '0x' + tx.serialize().toString('hex')
    })
}

function defaultWallet (account) {
  return defaultHdNode(account).deriveChild(0).getWallet()
}

function defaultAddress (account) {
  return defaultWallet(account).getChecksumAddressString()
}

function sweep (account, cryptoCode, hdIndex) {
  const wallet = paymentHdNode(account).deriveChild(hdIndex).getWallet()
  const fromAddress = wallet.getChecksumAddressString()

  return confirmedBalance(fromAddress)
    .then(r => {
      if (r.eq(0)) return

      return generateTx(defaultAddress(account), wallet, r, true)
        .then(signedTx => pify(web3.eth.sendRawTransaction)(signedTx))
    })
}

function newAddress (account, info) {
  const childNode = paymentHdNode(account).deriveChild(info.hdIndex)
  return Promise.resolve(childNode.getWallet().getChecksumAddressString())
}

function getStatus (account, toAddress, cryptoAtoms, cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => confirmedBalance(toAddress))
    .then(confirmed => {
      if (confirmed.gte(cryptoAtoms)) return {status: 'confirmed'}

      return pendingBalance(toAddress)
        .then(pending => {
          if (pending.gte(cryptoAtoms)) return {status: 'published'}
          if (pending.gt(0)) return {status: 'insufficientFunds'}
          return {status: 'notSeen'}
        })
    })
}

function paymentHdNode (account) {
  const masterSeed = account.seed
  if (!masterSeed) throw new Error('No master seed!')
  const key = hdkey.fromMasterSeed(masterSeed)
  return key.derivePath(paymentPrefixPath)
}

function defaultHdNode (account) {
  const masterSeed = account.seed
  if (!masterSeed) throw new Error('No master seed!')
  const key = hdkey.fromMasterSeed(masterSeed)
  return key.derivePath(defaultPrefixPath)
}

function newFunding (account, cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => {
      const fundingAddress = defaultAddress(account)

      const promises = [
        pendingBalance(fundingAddress),
        confirmedBalance(fundingAddress)
      ]

      return Promise.all(promises)
        .then(([fundingPendingBalance, fundingConfirmedBalance]) => ({
          fundingPendingBalance,
          fundingConfirmedBalance,
          fundingAddress
        }))
    })
}
