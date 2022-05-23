'use strict'

const _ = require('lodash/fp')
const Web3 = require('web3')
const web3 = new Web3()
const hdkey = require('ethereumjs-wallet/hdkey')
const { FeeMarketEIP1559Transaction } = require('@ethereumjs/tx')
const { default: Common, Chain, Hardfork } = require('@ethereumjs/common')
const util = require('ethereumjs-util')
const coins = require('@lamassu/coins')
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
  connect,
  checkBlockchainStatus
}

function connect (url) {
  web3.setProvider(new web3.providers.HttpProvider(url))
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
    .then(pify(web3.eth.sendSignedTransaction))
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
  return Promise.all(promises).then(([pending, confirmed]) => BN(pending).minus(confirmed))
}
const confirmedBalance = (address, cryptoCode) => _balance(false, address, cryptoCode)

function _balance (includePending, address, cryptoCode) {
  if (coins.utils.isErc20Token(cryptoCode)) {
    const contract = new web3.eth.Contract(ABI.ERC20, coins.utils.getErc20Token(cryptoCode).contractAddress)
    return contract.methods.balanceOf(address.toLowerCase()).call((_, balance) => {
      return contract.methods.decimals().call((_, decimals) => BN(balance).div(10 ** decimals))
    })
  }
  const block = includePending ? 'pending' : undefined
  return pify(web3.eth.getBalance)(address.toLowerCase(), block)
    /* NOTE: Convert bn.js bignum to bignumber.js bignum */
    .then(balance => balance ? BN(balance) : BN(0))
}

function generateTx (_toAddress, wallet, amount, includesFee, cryptoCode) {
  const fromAddress = '0x' + wallet.getAddress().toString('hex')

  const isErc20Token = coins.utils.isErc20Token(cryptoCode)
  const toAddress = isErc20Token ? coins.utils.getErc20Token(cryptoCode).contractAddress : _toAddress.toLowerCase()

  let contract, contractData
  if (isErc20Token) {
    contract = new web3.eth.Contract(ABI.ERC20, toAddress)
    contractData = isErc20Token && contract.methods.transfer(_toAddress.toLowerCase(), hex(toSend)).encodeABI()
  }

  const txTemplate = {
    from: fromAddress,
    to: toAddress,
    value: amount.toString()
  }

  if (isErc20Token) txTemplate.data = contractData

  const common = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.London })

  const promises = [
    pify(web3.eth.estimateGas)(txTemplate),
    pify(web3.eth.getGasPrice)(),
    pify(web3.eth.getTransactionCount)(fromAddress),
    pify(web3.eth.getBlock)('pending')
  ]

  return Promise.all(promises)
    .then(([gas, gasPrice, txCount, { baseFeePerGas }]) => [
      BN(gas),
      BN(gasPrice),
      _.max([1, txCount, lastUsedNonces[fromAddress] + 1]),
      BN(baseFeePerGas)
    ])
    .then(([gas, gasPrice, txCount, baseFeePerGas]) => {
      lastUsedNonces[fromAddress] = txCount

      const toSend = includesFee
        ? amount.minus(gasPrice.times(gas))
        : amount

      const maxPriorityFeePerGas = new BN(2.5) // web3 default value
      const maxFeePerGas = new BN(2).times(baseFeePerGas).plus(maxPriorityFeePerGas)

      const rawTx = {
        chainId: 1,
        nonce: txCount,
        maxPriorityFeePerGas: web3.utils.toHex(web3.utils.toWei(maxPriorityFeePerGas.toString(), 'gwei')),
        maxFeePerGas: web3.utils.toHex(web3.utils.toWei(maxFeePerGas.toString(), 'gwei')),
        gasLimit: hex(gas),
        to: toAddress,
        from: fromAddress,
        value: isErc20Token ? hex(BN(0)) : hex(toSend)
      }

      if (isErc20Token) {
        rawTx.data = contractData
      }

      const tx = FeeMarketEIP1559Transaction.fromTxData(rawTx, { common })
      const privateKey = wallet.getPrivateKey()

      const signedTx = tx.sign(privateKey)

      return '0x' + signedTx.serialize().toString('hex')
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
        .then(signedTx => pify(web3.eth.sendSignedTransaction)(signedTx))
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

function checkBlockchainStatus (cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => connect(`http://localhost:${coins.utils.getCryptoCurrency(cryptoCode).defaultPort}`))
    .then(() => web3.eth.syncing)
    .then(res => res === false ? 'ready' : 'syncing')
}
