const _ = require('lodash/fp')
const { utils: coinUtils } = require('@lamassu/coins')
const BN = require('../../../bn')

const { Seed, WalletServer } = require('cardano-wallet-js')
const SUPPORTED_COINS = ['ADA']

const cryptoRec = coinUtils.getCryptoCurrency('BTC')
const unitScale = cryptoRec.unitScale

function buildWalletServer (url) {
  return WalletServer.init(url)
}

function createWallet (account) {
  const recoveryPhrase = Seed.generateRecoveryPhrase()
  const mnemonicSentence = Seed.toMnemonicList(recoveryPhrase)
  const name = 'cardano-lamassu-wallet'
  return buildWalletServer(account.url).createOrRestoreShelleyWallet(name, mnemonicSentence)
}

function getStatus (account, tx, requested, settings, operatorId) {
  const { toAddress, cryptoCode } = tx
  // We could search for the toAddress in the list of incoming transactions output
  return checkCryptoCode(cryptoCode)
    .then(() => getWallet(account))
    .then(wallet => Promise.all([wallet.getAvailableBalance(), wallet.getTransactions()]))
    .then(([confirmed, txs]) => {
      const tx = _.head(_.filter(tx =>
        tx.direction === 'incoming' &&
        _.includes(toAddress, _.map(output => output.address))(tx.outputs)
      )(txs))
      if (tx.status === 'in_ledger') return { receivedCryptoAtoms: confirmed, status: 'confirmed' }
      return { receivedCryptoAtoms: 0, status: 'notSeen' }
    })
}

function newAddress (account, info, tx, settings, operatorId) {
  return checkCryptoCode(info.cryptoCode)
    .then(() => getWallet(account))
    .then(wallet => wallet.getUnusedAddresses())
    .then(([addresses, wallet]) => {
      if (!_.isEmpty(addresses)) {
        return addresses.slice(0, 1)
      }
      return wallet.getNextAddress()
    })
}

// function getWalletPendingBalance (wallet) {
//   return wallet.getTransactions()
//     .then(txs => {
//       const pendingTxs = _.filter(tx => !_.includes(tx.status, ['in_ledger']))(txs)
//       return _.sumBy(tx => tx.amount)(pendingTxs) // should we consider the direction before adding?
//     })
// }

function newFunding (account, cryptoCode, settings, operatorId) {
  return checkCryptoCode(cryptoCode)
    .then(() => getWallet(account))
    .then(wallet => {
      const promises = [
        newAddress(account),
        new BN(0), // is the pending insignificant or should we use something like getWalletPendingBalance?
        wallet.getAvailableBalance()
      ]

      return Promise.all(promises)
        .then(([fundingPendingBalance, fundingConfirmedBalance, fundingAddress]) => ({
          fundingPendingBalance,
          fundingConfirmedBalance,
          fundingAddress
        }))
    })
}

function balance (account, cryptoCode, settings, operatorId) {
  return checkCryptoCode(cryptoCode)
    .then(() => getWallet(account))
    .then(wallet => wallet.getAvailableBalance())
    .then(balance => new BN(balance).shiftedBy(unitScale).decimalPlaces(0))
}

function getWallet (account) {
  const walletServer = buildWalletServer(account.url)
  return walletServer.wallets().then(wallets => walletServer.getShelleyWallet(wallets[0].id))
}

function checkBlockchainStatus (cryptoCode, account) {
  return checkCryptoCode(cryptoCode)
    .then(() => buildWalletServer(account.url).getNetworkInformation())
    .then(networkInfo => networkInfo.sync_progress.status)
}

function checkCryptoCode (cryptoCode) {
  if (!SUPPORTED_COINS.includes(cryptoCode)) {
    return Promise.reject(new Error('Unsupported crypto: ' + cryptoCode))
  }

  return Promise.resolve()
}

module.exports = {
  balance,
  // sendCoins,
  newAddress,
  getStatus,
  newFunding,
  checkBlockchainStatus
}
