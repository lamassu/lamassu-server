const BitGo = require('bitgo')
const { toLegacyAddress, toCashAddress } = require('bchaddrjs')

const BN = require('../../../bn')

const E = require('../../../error')

const pjson = require('../../../../package.json')
const userAgent = 'Lamassu-Server/' + pjson.version

const NAME = 'BitGo'
const SUPPORTED_COINS = ['BTC', 'ZEC', 'LTC', 'BCH']

function buildBitgo (account) {
  const env = account.environment === 'test' ? 'test' : 'prod'
  return new BitGo.BitGo({ accessToken: account.token, env, userAgent: userAgent })
}

function getWallet (account, cryptoCode) {
  const bitgo = buildBitgo(account)
  const coin = account.environment === 'test' ? `t${cryptoCode.toLowerCase()}` : cryptoCode.toLowerCase()

  return bitgo.coin(coin).wallets().get({ id: account[`${cryptoCode}WalletId`] })
}

function checkCryptoCode (cryptoCode) {
  if (!SUPPORTED_COINS.includes(cryptoCode)) {
    return Promise.reject(new Error('Unsupported crypto: ' + cryptoCode))
  }

  return Promise.resolve()
}

function getLegacyAddress (address, cryptoCode) {
  const BCH_CODES = ['BCH', 'TBCH']
  if (!BCH_CODES.includes(cryptoCode)) return address

  return toLegacyAddress(address)
}

function getCashAddress (address, cryptoCode) {
  const BCH_CODES = ['BCH', 'TBCH']
  if (!BCH_CODES.includes(cryptoCode)) return address

  return toCashAddress(address)
}

function sendCoins (account, address, cryptoAtoms, cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => getWallet(account, cryptoCode))
    .then(wallet => {
      const params = {
        address: getLegacyAddress(address, cryptoCode),
        amount: cryptoAtoms.toNumber(),
        walletPassphrase: account[`${cryptoCode}WalletPassphrase`]
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

function balance (account, cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => getWallet(account, cryptoCode))
    .then(wallet => BN(wallet._wallet.spendableBalanceString))
}

function newAddress (account, info) {
  return checkCryptoCode(info.cryptoCode)
    .then(() => getWallet(account, info.cryptoCode))
    .then(wallet => {
      return wallet.createAddress()
        .then(result => {
          const address = result.address

          // If a label was provided, set the label
          if (info.label) {
            return wallet.updateAddress({ address: address, label: info.label })
              .then(() => getCashAddress(address, info.cryptoCode))
          }

          return getCashAddress(address, info.cryptoCode)
        })
    })
}

function getStatus (account, toAddress, requested, cryptoCode) {
  const bitgo = buildBitgo(account)
  return checkCryptoCode(cryptoCode)
    .then(() => bitgo.blockchain().getAddress({ address: getLegacyAddress(toAddress, cryptoCode) }))
    .then(rec => {
      if (rec.balance === 0) return { status: 'notSeen' }
      if (requested.gt(rec.balance)) return { status: 'insufficientFunds' }
      if (requested.gt(rec.confirmedBalance)) return { status: 'authorized' }
      return { status: 'confirmed' }
    })
}

function newFunding (account, cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => {
      return getWallet(account, cryptoCode)
        .then(wallet => {
          return wallet.createAddress()
            .then(result => {
              const fundingAddress = result.address
              return wallet.updateAddress({ address: fundingAddress, label: 'Funding Address' })
                .then(() => ({
                  fundingPendingBalance: BN(wallet._wallet.balanceString),
                  fundingConfirmedBalance: BN(wallet._wallet.confirmedBalanceString),
                  fundingAddress: getCashAddress(fundingAddress, cryptoCode)
                }))
            })
        })
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
