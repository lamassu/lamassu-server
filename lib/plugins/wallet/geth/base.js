'use strict'

const _ = require('lodash/fp')
const Web3 = require('web3')
const web3 = new Web3()
const hdkey = require('ethereumjs-wallet/hdkey')
const { FeeMarketEIP1559Transaction } = require('@ethereumjs/tx')
const { default: Common, Chain, Hardfork } = require('@ethereumjs/common')
const Tx = require('ethereumjs-tx')
const { default: PQueue } = require('p-queue')
const util = require('ethereumjs-util')
const coins = require('@lamassu/coins')

const _pify = require('pify')
const BN = require('../../../bn')
const ABI = require('../../tokens')
const logger = require('../../../logger')

exports.SUPPORTED_MODULES = ['wallet']

const paymentPrefixPath = "m/44'/60'/0'/0'"
const defaultPrefixPath = "m/44'/60'/1'/0'"
let lastUsedNonces = {}

module.exports = {
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
  checkBlockchainStatus,
  getTxHashesByAddress,
  _balance
}

const SWEEP_QUEUE = new PQueue({
  concurrency: 3,
  interval: 250,
})

const infuraCalls = {}

const pify = _function => {
  if (_.isString(_function.call)) logInfuraCall(_function.call)
  return _pify(_function)
}

const logInfuraCall = call => {
  if (!_.includes('infura', web3.currentProvider.host)) return
  _.isNil(infuraCalls[call]) ? infuraCalls[call] = 1 : infuraCalls[call]++
  logger.info(`Calling web3 method ${call} via Infura. Current count for this session: ${JSON.stringify(infuraCalls)}`)
}

function connect (url) {
  web3.setProvider(new web3.providers.HttpProvider(url))
}

const hex = bigNum => '0x' + bigNum.integerValue(BN.ROUND_DOWN).toString(16)

function privateKey (account) {
  return defaultWallet(account).getPrivateKey()
}

function isStrictAddress (cryptoCode, toAddress, settings, operatorId) {
  return checkCryptoCode(cryptoCode)
    .then(() => util.isValidChecksumAddress(toAddress))
}

function getTxHashesByAddress (cryptoCode, address) {
  throw new Error(`Transactions hash retrieval is not implemented for this coin!`)
}

function sendCoins (account, tx, settings, operatorId, feeMultiplier) {
  const { toAddress, cryptoAtoms, cryptoCode } = tx
  const isErc20Token = coins.utils.isErc20Token(cryptoCode)

  return (isErc20Token ? generateErc20Tx : generateTx)(toAddress, defaultWallet(account), cryptoAtoms, false, cryptoCode)
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
    }).then(BN)
  }
  const block = includePending ? 'pending' : undefined
  return pify(web3.eth.getBalance)(address.toLowerCase(), block)
    /* NOTE: Convert bn.js bignum to bignumber.js bignum */
    .then(balance => balance ? BN(balance) : BN(0))
}

function generateErc20Tx (_toAddress, wallet, amount, includesFee, cryptoCode) {
  const fromAddress = '0x' + wallet.getAddress().toString('hex')

  const toAddress = coins.utils.getErc20Token(cryptoCode).contractAddress

  const contract = new web3.eth.Contract(ABI.ERC20, toAddress)
  const contractData = contract.methods.transfer(_toAddress.toLowerCase(), hex(amount))

  const txTemplate = {
    from: fromAddress,
    to: toAddress,
    value: hex(BN(0)),
    data: contractData.encodeABI()
  }

  const common = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.London })

  const promises = [
    pify(contractData.estimateGas)(txTemplate),
    pify(web3.eth.getTransactionCount)(fromAddress),
    pify(web3.eth.getBlock)('pending')
  ]

  return Promise.all(promises)
    .then(([gas, txCount, { baseFeePerGas }]) => [
      BN(gas),
      _.max([0, txCount, lastUsedNonces[fromAddress] + 1]),
      BN(baseFeePerGas)
    ])
    .then(([gas, txCount, baseFeePerGas]) => {
      lastUsedNonces[fromAddress] = txCount

      const maxPriorityFeePerGas = new BN(web3.utils.toWei('2.5', 'gwei')) // web3 default value
      const maxFeePerGas = new BN(2).times(baseFeePerGas).plus(maxPriorityFeePerGas)

      if (includesFee && (toSend.isNegative() || toSend.isZero())) {
        throw new Error(`Trying to send a nil or negative amount (Transaction ID: ${txId} | Value provided: ${toSend.toNumber()}). This is probably caused due to the estimated fee being higher than the address' balance.`)
      }

      const rawTx = {
        chainId: 1,
        nonce: txCount,
        maxPriorityFeePerGas: web3.utils.toHex(maxPriorityFeePerGas),
        maxFeePerGas: web3.utils.toHex(maxFeePerGas),
        gasLimit: hex(gas),
        to: toAddress,
        from: fromAddress,
        value: hex(BN(0)),
        data: contractData.encodeABI()
      }

      const tx = FeeMarketEIP1559Transaction.fromTxData(rawTx, { common })
      const privateKey = wallet.getPrivateKey()

      const signedTx = tx.sign(privateKey)

      return '0x' + signedTx.serialize().toString('hex')
    })
}

function generateTx (_toAddress, wallet, amount, includesFee, cryptoCode, txId) {
  const fromAddress = '0x' + wallet.getAddress().toString('hex')

  const toAddress = _toAddress.toLowerCase()

  const txTemplate = {
    from: fromAddress,
    to: toAddress,
    value: amount.toString()
  }

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
      _.max([0, txCount, lastUsedNonces[fromAddress] + 1]),
      BN(baseFeePerGas)
    ])
    .then(([gas, gasPrice, txCount, baseFeePerGas]) => {
      lastUsedNonces[fromAddress] = txCount

      const maxPriorityFeePerGas = new BN(web3.utils.toWei('2.5', 'gwei')) // web3 default value
      const neededPriority = new BN(web3.utils.toWei('2.0', 'gwei'))
      const maxFeePerGas = baseFeePerGas.plus(neededPriority)
      const newGasPrice = BN.minimum(maxFeePerGas, baseFeePerGas.plus(maxPriorityFeePerGas))

      const toSend = includesFee
        ? new BN(amount).minus(newGasPrice.times(gas))
        : amount

      const rawTx = {
        chainId: 1,
        nonce: txCount,
        maxPriorityFeePerGas: web3.utils.toHex(maxPriorityFeePerGas),
        maxFeePerGas: web3.utils.toHex(maxFeePerGas),
        gasLimit: hex(gas),
        to: toAddress,
        from: fromAddress,
        value: hex(toSend)
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

function sweep (account, txId, cryptoCode, hdIndex, settings, operatorId) {
  const wallet = paymentHdNode(account).deriveChild(hdIndex).getWallet()
  const fromAddress = wallet.getChecksumAddressString()

  return SWEEP_QUEUE.add(() => confirmedBalance(fromAddress, cryptoCode)
    .then(r => {
      if (r.eq(0)) return

      return generateTx(defaultAddress(account), wallet, r, true, cryptoCode, txId)
        .then(signedTx => pify(web3.eth.sendSignedTransaction)(signedTx))
    })
  )
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
          if (BN(pending).gte(requested)) return { receivedCryptoAtoms: pending, status: 'published' }
          if (BN(pending).gt(0)) return { receivedCryptoAtoms: pending, status: 'insufficientFunds' }
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
