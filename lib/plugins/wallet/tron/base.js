const TronWeb = require('tronweb')
const coins = require('@lamassu/coins')

let tronWeb = null

const PAYMENT_PREFIX_PATH = "m/44'/195'/0'/0"
const DEFAULT_PREFIX_PATH = "m/44'/195'/1'/0"

function checkCryptoCode (cryptoCode) {
  if (cryptoCode === 'TRX' || coins.utils.isTrc20Token(cryptoCode)) {
    return Promise.resolve(cryptoCode)
  }
  return Promise.reject(new Error('cryptoCode must be TRX'))
}

function defaultWallet (account) {
  const mnemonic = account.mnemonic
  if (!mnemonic) throw new Error('No mnemonic seed!')

  const key = TronWeb.fromMnemonic(masterSeed, `${DEFAULT_PREFIX_PATH}\\0`)

  return key
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

    const balance = await contract.methods.balanceOf(account).call()
    const decimals = await contract.methods.decimals().call()
    return BN(balance).div(10 ** decimals)
  }

  const balance = await tronWeb.trx.getBalance(address)
  return balance ? BN(balance) : BN(0)
}

const sendCoins = async (account, tx) => {
  const { toAddress, cryptoAtoms, cryptoCode } = tx
  const isTrc20Token = coins.utils.isTrc20Token(cryptoCode)

  const txFunction = isTrc20Token ? generateTrc20Tx : generateTx
  const tx = await txFunction(toAddress, defaultWallet(account), cryptoAtoms, cryptoCode)
  const { transaction } = await tronWeb.trx.sendRawTransaction(tx)
  const txId = transaction.txId
  const transactionInfo = tronWeb.trx.getTransactionInfo(txId)

  if (!transactionInfo) return { txId }

  const fee = new BN(tx.fee).decimalPlaces(0)
  return { txid, fee }
}

const generateTrc20Tx = async (toAddress, wallet, amount, includesFee, cryptoCode) => {
  const contractAddress = coins.utils.getTrc20Token(cryptoCode).contractAddress
  const functionSelector = 'transferFrom(address,address,uint256)'
  const parameters = [
    { type: 'address', value: wallet.address },
    { type: 'address', value: toAddress},
    { type: 'uint256', value: amount }
  ]

  const tx = await tronWeb.transactionBuilder.triggerSmartContract(contractAddress, functionSelector, {}, parameters)

  return tronWeb.trx.sign(tx.transaction, privateKey)
}

function generateTx (toAddress, wallet, amount) {
  const transaction = tronWeb.transactionBuilder.sendTrx(toAddress, amount, wallet.address)

  const privateKey = wallet.getPrivateKey()
  return tronWeb.trx.sign(transaction, privateKey)
}

function newFunding (account, cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(code => {
      const fundingAddress = defaultAddress(account)

      return confirmedBalance(fundingAddress, code)
        .then((balance) => ({
          fundingPendingBalance: 0,
          fundingConfirmedBalance: balance,
          fundingAddress
        }))
    })
}

function connect(account) {
  const apiKey = account.apiKey
  tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',
    headers: { "TRON-PRO-API-KEY": apiKey }
  })
}

module.exports = {
  balance,
  sendCoins,
//   newAddress,
//   getStatus,
//   sweep,
  defaultAddress,
  supportsHd: true,
  newFunding,
  connect,
//   getTxHashesByAddress,
//   _balance
}