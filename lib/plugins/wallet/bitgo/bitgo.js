const _ = require('lodash/fp')

const BitGo = require('bitgo')
const { toLegacyAddress, toCashAddress } = require('bchaddrjs')

const BN = require('../../../bn')

const E = require('../../../error')

const pjson = require('../../../../package.json')
const userAgent = 'Lamassu-Server/' + pjson.version

const NAME = 'BitGo'
const SUPPORTED_COINS = ['BTC', 'ZEC', 'LTC', 'BCH', 'DASH']
const BCH_CODES = ['BCH', 'TBCH']

function buildBitgo (account) {
  const env = account.environment === 'test' ? 'test' : 'prod'
  return new BitGo.BitGo({ accessToken: account.token.trim(), env, userAgent: userAgent })
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
  if (!BCH_CODES.includes(cryptoCode)) return address

  return toLegacyAddress(address)
}

function getCashAddress (address, cryptoCode) {
  if (!BCH_CODES.includes(cryptoCode)) return address

  return toCashAddress(address)
}

function formatToGetStatus (address, cryptoCode) {
  if (!BCH_CODES.includes(cryptoCode)) return address

  const [part1, part2] = getLegacyAddress(address, cryptoCode).split(':')
  return part2 || part1
}

function sendCoins (account, tx, settings, operatorId) {
  const { toAddress, cryptoAtoms, cryptoCode } = tx
  return checkCryptoCode(cryptoCode)
    .then(() => getWallet(account, cryptoCode))
    .then(wallet => {
      const params = {
        address: getLegacyAddress(toAddress, cryptoCode),
        amount: cryptoAtoms.toNumber(),
        walletPassphrase: account[`${cryptoCode}WalletPassphrase`],
        enforceMinConfirmsForChange: false
      }
      return wallet.send(params)
    })
    .then(result => {
      let fee = parseFloat(result.transfer.feeString)
      let txid = result.transfer.txid

      return { txid: txid, fee: new BN(fee).decimalPlaces(0) }
    })
    .catch(err => {
      if (err.message === 'insufficient funds') throw new E.InsufficientFundsError()
      throw err
    })
}

function balance (account, cryptoCode, settings, operatorId) {
  return checkCryptoCode(cryptoCode)
    .then(() => getWallet(account, cryptoCode))
    .then(wallet => new BN(wallet._wallet.spendableBalanceString))
}

function newAddress (account, info, tx, settings, operatorId) {
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

function getStatus (account, tx, requested, settings, operatorId) {
  const { toAddress, cryptoCode } = tx
  return checkCryptoCode(cryptoCode)
    .then(() => getWallet(account, cryptoCode))
    .then(wallet => wallet.transfers({
      type: 'receive',
      address: formatToGetStatus(toAddress, cryptoCode)
    }))
    .then(({ transfers }) => {
      const filterConfirmed = _.filter(it =>
        it.state === 'confirmed' && it.type === 'receive'
      )
      const filterPending = _.filter(it =>
        (it.state === 'confirmed' || it.state === 'unconfirmed') &&
        it.type === 'receive'
      )

      const sum = _.reduce((acc, val) => val.plus(acc), new BN(0))
      const toBn = _.map(it => new BN(it.valueString))

      const confirmed = _.compose(sum, toBn, filterConfirmed)(transfers)
      const pending = _.compose(sum, toBn, filterPending)(transfers)

      if (confirmed.gte(requested)) return { receivedCryptoAtoms: confirmed, status: 'confirmed' }
      if (pending.gte(requested)) return { receivedCryptoAtoms: pending, status: 'authorized' }
      if (pending.gt(0)) return { receivedCryptoAtoms: pending, status: 'insufficientFunds' }
      return { receivedCryptoAtoms: pending, status: 'notSeen' }
    })
}

function newFunding (account, cryptoCode, settings, operatorId) {
  return checkCryptoCode(cryptoCode)
    .then(() => {
      return getWallet(account, cryptoCode)
        .then(wallet => {
          return wallet.createAddress()
            .then(result => {
              const fundingAddress = result.address
              return wallet.updateAddress({ address: fundingAddress, label: 'Funding Address' })
                .then(() => ({
                  fundingPendingBalance: new BN(wallet._wallet.balanceString),
                  fundingConfirmedBalance: new BN(wallet._wallet.confirmedBalanceString),
                  fundingAddress: getCashAddress(fundingAddress, cryptoCode)
                }))
            })
        })
    })
}

function cryptoNetwork (account, cryptoCode, settings, operatorId) {
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
