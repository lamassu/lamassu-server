const BitGo = require('bitgo')
const BN = require('../../../bn')

const E = require('../../../error')

const pjson = require('../../../../package.json')
const userAgent = 'Lamassu-Server/' + pjson.version

const NAME = 'BitGo'

function buildBitgo (account) {
  return new BitGo.BitGo({accessToken: account.token, env: 'prod', userAgent: userAgent})
}

function getWallet (account) {
  const bitgo = buildBitgo(account)
  return bitgo.wallets().get({ id: account.walletId })
}

function checkCryptoCode (cryptoCode) {
  if (cryptoCode !== 'BTC') {
    return Promise.reject(new Error('Unsupported crypto: ' + cryptoCode))
  }

  return Promise.resolve()
}

function sendCoins (account, address, cryptoAtoms, cryptoCode) {
  return checkCryptoCode(cryptoCode)
  .then(() => getWallet(account))
  .then(wallet => {
    const params = {
      address: address,
      amount: cryptoAtoms.toNumber(),
      walletPassphrase: account.walletPassphrase
    }
    return wallet.sendCoins(params)
  })
  .then(result => {
    return result.hash
  })
  .catch(err => {
    if (err.message === 'Insufficient funds') throw new E.InsufficientFundsError()
    throw err
  })
}

function balance (account, cryptoCode) {
  return checkCryptoCode(cryptoCode)
  .then(() => getWallet(account))
  .then(wallet => BN(wallet.wallet.spendableConfirmedBalance))
}

function newAddress (account, info) {
  return checkCryptoCode(info.cryptoCode)
  .then(() => getWallet(account))
  .then(wallet => {
    return wallet.createAddress()
    .then(result => {
      const address = result.address

      // If a label was provided, set the label
      if (info.label) {
        return wallet.setLabel({ address: address, label: info.label })
        .then(() => address)
      }

      return address
    })
  })
}

function getStatus (account, toAddress, requested, cryptoCode) {
  const bitgo = buildBitgo(account)
  return checkCryptoCode(cryptoCode)
  .then(() => bitgo.blockchain().getAddress({address: toAddress}))
  .then(rec => {
    if (rec.balance === 0) return {status: 'notSeen'}
    if (requested.gt(rec.balance)) return {status: 'insufficientFunds'}
    if (requested.gt(rec.confirmedBalance)) return {status: 'authorized'}
    return {status: 'confirmed'}
  })
}

module.exports = {
  NAME,
  balance,
  sendCoins,
  newAddress,
  getStatus
}
