const { getOrCreateWalletCredentials } = require('./wallet')
const CardanoApi = require('./api/api')
const cardanoClient = require('./client')

const MINIMUM_CONFIRMATIONS_FOR_APPROVE = 1

// TODO: work with BN here instead of api.js?

function assertCryptoCode(cryptoCode) {
  if (cryptoCode !== 'ADA') {
    throw new Error(`Unsupported crypto: ${cryptoCode}`)
  }
}

/**
 * We don't use `account` parameter, because there isn't any interesting information for us,
 * only global key is `seed`, but this seed is created from 24-word mnemonic, so it
 * isn't usefull - instead of this we use getOrCreateWalletCredentials() function to obtain wallet credentials
 */
async function balance(account, cryptoCode) {
  assertCryptoCode(cryptoCode)

  return getOrCreateWalletCredentials()
    .then(({ walletId, index }) =>
      cardanoClient.walletBalance(
        walletId,
        index,
        MINIMUM_CONFIRMATIONS_FOR_APPROVE
      )
    )
    .then(result => result.confirmed)
}

async function sendCoins(account, address, cryptoAtoms, cryptoCode) {
  assertCryptoCode(cryptoCode)

  return getOrCreateWalletCredentials().then(({ walletId, index }) =>
    cardanoClient.sendCoins(walletId, index, address, cryptoAtoms)
  )
}

async function newAddress(account, info) {
  assertCryptoCode(info.cryptoCode)

  return getOrCreateWalletCredentials().then(({ walletId, index }) =>
    cardanoClient.newAddress(walletId, index)
  )
}

async function getStatus(account, toAddress, requested, cryptoCode) {
  assertCryptoCode(cryptoCode)

  // we include only income transactions, because we need only
  // currency which customer sent to this address, outcome transactions
  // are not interesting for us in this case
  return cardanoClient
    .addressBalance(
      toAddress,
      MINIMUM_CONFIRMATIONS_FOR_APPROVE,
      CardanoApi.INCLUDE_INCOME_TRANSACTIONS
    )
    .then(balance => {
      if (balance.confirmed.gte(requested)) {
        return { status: 'confirmed' }
      } else if (balance.total.gte(requested)) {
        return { status: 'authorized' }
      } else if (balance.total.gt(0)) {
        return { status: 'insufficientFunds' }
      }

      return { status: 'notSeen' }
    })
}

async function newFunding(account, cryptoCode) {
  assertCryptoCode(cryptoCode)

  return getOrCreateWalletCredentials()
    .then(({ walletId, index }) =>
      Promise.all([
        cardanoClient.walletBalance(
          walletId,
          index,
          MINIMUM_CONFIRMATIONS_FOR_APPROVE
        ),
        cardanoClient.newAddress(walletId, index)
      ])
    )
    .then(([walletBalance, fundingAddress]) => ({
      fundingPendingBalance: walletBalance.total,
      fundingConfirmedBalance: walletBalance.confirmed,
      fundingAddress
    }))
}

module.exports = {
  balance,
  sendCoins,
  newAddress,
  getStatus,
  newFunding
}
