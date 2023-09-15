const TronWeb = require('tronweb')
const coins = require('@lamassu/coins')
const { default: PQueue } = require('p-queue')

const BN = require('../../../bn')

let tronWeb = null

const DEFAULT_PREFIX_PATH = "m/44'/195'/0'/0"
const PAYMENT_PREFIX_PATH = "m/44'/195'/1'/0"

const SWEEP_QUEUE = new PQueue({
  concurrency: 3,
  interval: 250,
})

function checkCryptoCode (cryptoCode) {
  if (cryptoCode === 'TRX' || coins.utils.isTrc20Token(cryptoCode)) {
    return Promise.resolve(cryptoCode)
  }
  return Promise.reject(new Error('cryptoCode must be TRX'))
}

function defaultWallet (account) {
  const mnemonic = account.mnemonic
  if (!mnemonic) throw new Error('No mnemonic seed!')

  return TronWeb.fromMnemonic(mnemonic.replace(/[\r\n]/gm, ' ').trim(), `${DEFAULT_PREFIX_PATH}/0`)
}

function paymentWallet (account, index) {
  const mnemonic = account.mnemonic
  if (!mnemonic) throw new Error('No mnemonic seed!')

  return TronWeb.fromMnemonic(mnemonic.replace(/[\r\n]/gm, ' ').trim(), `${PAYMENT_PREFIX_PATH}/${index}`)
}

function newAddress (account, info, tx, settings, operatorId) {
  const wallet = paymentWallet(account, info.hdIndex)
  return Promise.resolve(wallet.address)
}

function defaultAddress (account) {
  return defaultWallet(account).address
}

function balance (account, cryptoCode, settings, operatorId) {
  return checkCryptoCode(cryptoCode)
    .then(code => confirmedBalance(defaultAddress(account), code))
}

const confirmedBalance = (address, cryptoCode) => _balance(address, cryptoCode)

const _balance = async (address, cryptoCode) => {
  if (coins.utils.isTrc20Token(cryptoCode)) {
    const contractAddress = coins.utils.getTrc20Token(cryptoCode).contractAddress
    const { abi } = await tronWeb.trx.getContract(contractAddress)
    const contract = tronWeb.contract(abi.entrys, contractAddress)

    const balance = await contract.methods.balanceOf(address).call()
    return BN(balance.toString())
  }

  const balance = await tronWeb.trx.getBalance(address)
  return balance ? BN(balance) : BN(0)
}

const sendCoins = async (account, tx) => {
  const { toAddress, cryptoAtoms, cryptoCode } = tx
  const isTrc20Token = coins.utils.isTrc20Token(cryptoCode)

  const txFunction = isTrc20Token ? generateTrc20Tx : generateTx
  const rawTx = await txFunction(toAddress, defaultWallet(account), cryptoAtoms.toString(), cryptoCode)

  let response = null

  try {
    response = await tronWeb.trx.sendRawTransaction(rawTx)
    if (!response.result) throw new Error(response.code)
  } catch (err) {
    // for some reason err here is just a string
    throw new Error(err)
  }

  const transaction = response.transaction
  const txid = transaction.txID
  const transactionInfo = tronWeb.trx.getTransactionInfo(txid)

  if (!transactionInfo || !transactionInfo.fee) return { txid }

  const fee = new BN(transactionInfo.fee).decimalPlaces(0)
  return { txid, fee }
}

const generateTrc20Tx = async (toAddress, wallet, amount, cryptoCode) => {
  const contractAddress = coins.utils.getTrc20Token(cryptoCode).contractAddress
  const functionSelector = 'transfer(address,uint256)'
  const parameters = [
    { type: 'address', value: tronWeb.address.toHex(toAddress) },
    { type: 'uint256', value: amount }
  ]

  const tx = await tronWeb.transactionBuilder.triggerSmartContract(contractAddress, functionSelector, {}, parameters, wallet.address)

  return tronWeb.trx.sign(tx.transaction, wallet.privateKey.slice(2))
}

const generateTx = async (toAddress, wallet, amount) => {
  const transaction = await tronWeb.transactionBuilder.sendTrx(toAddress, amount, wallet.address)

  const privateKey = wallet.privateKey

  // their api return a hex string starting with 0x but expects without it
  return tronWeb.trx.sign(transaction, privateKey.slice(2))
}

function newFunding (account, cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(code => {
      const fundingAddress = defaultAddress(account)

      return confirmedBalance(fundingAddress, code)
        .then((balance) => ({
          fundingPendingBalance: BN(0),
          fundingConfirmedBalance: balance,
          fundingAddress
        }))
    })
}

function sweep (account, txId, cryptoCode, hdIndex) {
  const wallet = paymentWallet(account, hdIndex)
  const fromAddress = wallet.address
  const isTrc20Token = coins.utils.isTrc20Token(cryptoCode)

  const txFunction = isTrc20Token ? generateTrc20Tx : generateTx

  return SWEEP_QUEUE.add(async () => {
    const r = await confirmedBalance(fromAddress, cryptoCode)
    if (r.eq(0)) return
    const signedTx = await txFunction(defaultAddress(account), wallet, r.toString(), cryptoCode)
    let response = null
    try {
      response = await tronWeb.trx.sendRawTransaction(signedTx)
      if (!response.result) throw new Error(response.code)
    } catch (err) {
      // for some reason err here is just a string
      throw new Error(err)
    }
    return response
  })
}

function connect(account) {
  if (tronWeb != null) return
  const endpoint = account.endpoint
  const apiKey = account.apiKey
  tronWeb = new TronWeb({
    fullHost: endpoint,
    headers: { "TRON-PRO-API-KEY": apiKey },
    privateKey: '01'
  })
}

function getStatus (account, tx, requested, settings, operatorId) {
  const { toAddress, cryptoCode } = tx
  return checkCryptoCode(cryptoCode)
    .then(code => confirmedBalance(toAddress, code))
    .then((confirmed) => {
      if (confirmed.gte(requested)) return { receivedCryptoAtoms: confirmed, status: 'confirmed' }
      if (confirmed.gt(0)) return { receivedCryptoAtoms: confirmed, status: 'insufficientFunds' }
      return { receivedCryptoAtoms: 0, status: 'notSeen' }
    })
}

function getTxHashesByAddress (cryptoCode, address) {
  throw new Error(`Transactions hash retrieval is not implemented for this coin!`)
}

module.exports = {
  balance,
  sendCoins,
  newAddress,
  getStatus,
  sweep,
  defaultAddress,
  supportsHd: true,
  newFunding,
  connect,
  getTxHashesByAddress,
}
