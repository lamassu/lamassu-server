'use strict'

const Web3 = require('web3')
const web3 = new Web3()
const hdkey = require('ethereumjs-wallet/hdkey')
const Tx = require('ethereumjs-tx')
const util = require('ethereumjs-util')
const coins = require('lamassu-coins')
const pify = require('pify')
const BN = require('../../../bn')
const ABI = require('../../tokens')

const NAME = 'geth'
exports.SUPPORTED_MODULES = ['wallet']

const paymentPrefixPath = "m/44'/60'/0'/0'"
const defaultPrefixPath = "m/44'/60'/1'/0'"
let lastUsedNonces = {}

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

const hex = bigNum => '0x' + bigNum.integerValue(BN.ROUND_DOWN).toString(16)

function privateKey (account) {
  return defaultWallet(account).getPrivateKey()
}

function isStrictAddress (cryptoCode, toAddress, settings, operatorId) {
  return cryptoCode === 'ETH' && util.isValidChecksumAddress(toAddress)
}

function sendCoins (account, tx, settings, operatorId) {
  const { toAddress, cryptoAtoms, cryptoCode } = tx
  return generateTx(toAddress, defaultWallet(account), cryptoAtoms, false, cryptoCode)
    .then(pify(web3.eth.sendRawTransaction))
    .then(txid => {
      return pify(web3.eth.getTransaction)(txid)
        .then(tx => {
          if (!tx) return { txid }

          const fee = new BN(tx.gas).times(new BN(tx.gasPrice)).decimalPlaces(0)

          return { txid, fee }
        })
    })
}

function checkCryptoCode (cryptoCode) {
  if (cryptoCode === 'ETH' || coins.utils.isErc20Token(cryptoCode)) {
    return Promise.resolve(cryptoCode)
  }
  return Promise.reject(new Error('cryptoCode must be ETH'))
}

function balance (account, cryptoCode, settings, operatorId) {
  return checkCryptoCode(cryptoCode)
    .then(code => confirmedBalance(defaultAddress(account), code))
}

const pendingBalance = (address, cryptoCode) => {
  const promises = [_balance(true, address, cryptoCode), _balance(false, address, cryptoCode)]
  return Promise.all(promises).then(([pending, confirmed]) => pending.minus(confirmed))
}
const confirmedBalance = (address, cryptoCode) => _balance(false, address, cryptoCode)

function _balance (includePending, address, cryptoCode) {
  if (coins.utils.getCryptoCurrency(cryptoCode).type === 'erc-20') {
    const contract = web3.eth.contract(ABI.ERC20).at(coins.utils.getErc20Token(cryptoCode).contractAddress)
    return contract.balanceOf(address.toLowerCase())
  }
  const block = includePending ? 'pending' : undefined
  return pify(web3.eth.getBalance)(address.toLowerCase(), block)
}

function generateTx (_toAddress, wallet, amount, includesFee, cryptoCode) {
  const fromAddress = '0x' + wallet.getAddress().toString('hex')

  const isErc20Token = coins.utils.getCryptoCurrency(cryptoCode).type === 'erc-20'
  const toAddress = isErc20Token ? coins.utils.getErc20Token(cryptoCode).contractAddress : _toAddress.toLowerCase()

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
      const txCount = arr[2] <= lastUsedNonces[fromAddress]
        ? lastUsedNonces[fromAddress] + 1
        : arr[2]

      lastUsedNonces[fromAddress] = txCount

      const toSend = includesFee
        ? amount.minus(gasPrice.times(gas))
        : amount

      const contract = web3.eth.contract(ABI.ERC20).at(coins.utils.getErc20Token(cryptoCode).contractAddress)

      const rawTx = {
        chainId: 1,
        nonce: txCount,
        gasPrice: hex(gasPrice),
        gasLimit: gas,
        to: toAddress,
        from: fromAddress,
        value: isErc20Token ? hex(BN(0)) : hex(toSend)
      }

      if (isErc20Token && contract) {
        rawTx.data = contract.transfer.getData(toAddress, hex(toSend))
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

function sweep (account, cryptoCode, hdIndex, settings, operatorId) {
  const wallet = paymentHdNode(account).deriveChild(hdIndex).getWallet()
  const fromAddress = wallet.getChecksumAddressString()

  return confirmedBalance(fromAddress, cryptoCode)
    .then(r => {
      if (r.eq(0)) return

      return generateTx(defaultAddress(account), wallet, r, true, cryptoCode)
        .then(signedTx => pify(web3.eth.sendRawTransaction)(signedTx))
    })
}

function newAddress (account, info, tx, settings, operatorId) {
  const childNode = paymentHdNode(account).deriveChild(info.hdIndex)
  return Promise.resolve(childNode.getWallet().getChecksumAddressString())
}

function getStatus (account, tx, requested, settings, operatorId) {
  const { toAddress, cryptoCode } = tx
  return checkCryptoCode(cryptoCode)
    .then(code => Promise.all([confirmedBalance(toAddress, code), code]))
    .then(([confirmed, code]) => {
      if (confirmed.gte(requested)) return { receivedCryptoAtoms: confirmed, status: 'confirmed' }

      return pendingBalance(toAddress, code)
        .then(pending => {
          if (pending.gte(requested)) return { receivedCryptoAtoms: pending, status: 'published' }
          if (pending.gt(0)) return { receivedCryptoAtoms: pending, status: 'insufficientFunds' }
          return { receivedCryptoAtoms: pending, status: 'notSeen' }
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

function newFunding (account, cryptoCode, settings, operatorId) {
  return checkCryptoCode(cryptoCode)
    .then(code => {
      const fundingAddress = defaultAddress(account)

      const promises = [
        pendingBalance(fundingAddress, code),
        confirmedBalance(fundingAddress, code)
      ]

      return Promise.all(promises)
        .then(([fundingPendingBalance, fundingConfirmedBalance]) => ({
          fundingPendingBalance,
          fundingConfirmedBalance,
          fundingAddress
        }))
    })
}
