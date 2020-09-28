const _ = require('lodash/fp')

const BN = require('../../../bn')

const E = require('../../../error')

const pjson = require('../../../../package.json')
const userAgent = 'Lamassu-Server/' + pjson.version

const NAME = 'CryptX'
const SUPPORTED_COINS = ['BTC', 'LTC', 'BCH', 'ETH']


function getWallet (account, cryptoCode) {

  const coin = account.environment === 'test' ? `t${cryptoCode.toLowerCase()}` : cryptoCode.toLowerCase()
  const walletId = account[`${cryptoCode}WalletId`]
  const token = account.token.trim()

  return {
      createAddress() {

      },
      getBalanceByAddress(address, conf) {
          return // TODO call /{coin}/wallet/{walletId}/balance/{address}  minConf = conf
      },
      getBalance() {
          return undefined;
      }
  }
}

function checkCryptoCode (cryptoCode) {
  if (!SUPPORTED_COINS.includes(cryptoCode)) {
    return Promise.reject(new Error('Unsupported crypto: ' + cryptoCode))
  }

  return Promise.resolve()
}

function sendCoins (account, address, cryptoAtoms, cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => getWallet(account, cryptoCode))
    .then(wallet => {
      const params = {
        address: address,
        amount: cryptoAtoms.toNumber()
      }
      return wallet.send(params)
    })
    .then(result => {
      let fee = parseFloat(result.transfer.feeString)
      let txid = result.transfer.txid

      return { txid: txid, fee: BN(fee).round() }
    })
    .catch(err => {
      if (err.message === 'insufficient funds') throw new E.InsufficientFundsError()
      throw err
    })
}

function addressBalance (address, confs) {
    return // TODO call /{coin}/wallet/{walletId}/balance/{address}  minConf = confs
}

function confirmedBalance (address, cryptoCode) {
    return checkCryptoCode(cryptoCode)
        .then(() => addressBalance(address, 1))
}

function pendingBalance (address, cryptoCode) {
    return checkCryptoCode(cryptoCode)
        .then(() => addressBalance(address, 0))
}


function balance (account, cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => BN(getWallet(account, cryptoCode).getBalance())
    .then(wallet => wallet.))
}

function newAddress (account, info) {
  return checkCryptoCode(info.cryptoCode)
    .then(() => getWallet(account, info.cryptoCode))
    .then(wallet => {
      return wallet.createAddress()
        .then(result => {
          return result.address
        })
    })
}

function getStatus (account, toAddress, requested, cryptoCode) {
    return checkCryptoCode(cryptoCode)
        .then(() => {
                const confirmed = confirmedBalance(toAddress, cryptoCode)
                if (confirmed.gte(requested)) return {receivedCryptoAtoms: confirmed, status: 'confirmed'}

                const pending = pendingBalance(toAddress, cryptoCode)

                if (pending.gte(requested)) return {receivedCryptoAtoms: pending, status: 'authorized'}
                if (pending.gt(0)) return {receivedCryptoAtoms: pending, status: 'insufficientFunds'}
                return {receivedCryptoAtoms: pending, status: 'notSeen'}
            }
        )
}

function newFunding (account, cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => {
      return null;

      // TODO createAddress, getBalance,  return

        // return {
        //     fundingPendingBalance: BN(wallet.balanceString),
        //     fundingConfirmedBalance: BN(wallet.confirmedBalanceString),
        //     fundingAddress: fundingAddress
        // }
    })
}

function cryptoNetwork (account, cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => account.environment === 'test' ? 'test' : 'main')
}

module.exports = {
  NAME,
  balance,
  sendCoins,
  newAddress,
  getStatus,
  newFunding,
  cryptoNetwork
}
