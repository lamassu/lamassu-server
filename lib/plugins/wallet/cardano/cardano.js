const { walletId } = require("./mnemonic")
const cardanoApi = require("./api")

// TODO: work with BN here instead of api.js?

async function checkCryptoCode(cryptoCode) {
  if (cryptoCode !== 'ADA') {
    return Promise.reject(new Error(`Unsupported crypto: ${cryptoCode}`))
  }

  return Promise.resolve()
}

/**
 * TODO: instead of using walletId function we can
 *       inject walletId/index into account object
 *       in wallet.js - it's better?
 */
async function balance(account, cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => walletId())
    .then(({ walletId }) => cardanoApi.walletBalance(walletId, 1))
}

async function sendCoins(account, address, cryptoAtoms, cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => walletId())
    .then(({ walletId, index }) =>
      cardanoApi.sendCoins(walletId, index, address, cryptoAtoms)
    )
}

async function newAddress(account, info) {
  return checkCryptoCode(info.cryptoCode)
    .then(() => walletId())
    .then(({ walletId, index }) => cardanoApi.newAddress(walletId, index))
}

async function getStatus(account, toAddress, requested, cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() =>
      Promise.all([
        cardanoApi.addressBalance(toAddress, 1),
        cardanoApi.addressBalance(toAddress, 0)
      ])
    )
    .then(([confirmedBalance, totalBalance]) => {
      if (confirmedBalance.gte(requested)) {
        return { status: 'confirmed' }
      } else if (totalBalance.gte(request)) {
        return { status: 'authorized' }
      } else if (confirmedBalance.eq(totalBalance)) {
        return { status: 'insufficientFunds' }
      }

      return { status: 'notSeen' }
    })
}

async function newFunding(account, cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => walletId())
    .then(({ walletId, index }) =>
      Promise.all([
        cardanoApi.walletBalance(walletId, 0),
        cardanoApi.walletBalance(walletId, 1),
        cardanoApi.newAddress(walletId, index)
      ])
    )
    .then(
      ([fundingPendingBalance, fundingConfirmedBalance, fundingAddress]) => ({
        fundingPendingBalance,
        fundingConfirmedBalance,
        fundingAddress
      })
    )
}

module.exports = {
  balance,
  sendCoins,
  newAddress,
  getStatus,
  newFunding
}
