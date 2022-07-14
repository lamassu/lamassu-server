const _ = require('lodash/fp')
const { utils: coinUtils } = require('@lamassu/coins')
const BN = require('../../../bn')

const { WalletServer, AddressWallet } = require('cardano-wallet-js')
const SUPPORTED_COINS = ['ADA']

const cryptoRec = coinUtils.getCryptoCurrency('ADA')
const unitScale = cryptoRec.unitScale

function buildWalletServer (url) {
  return WalletServer.init(url)
}

// getWallet(account).then(w => w.getUsedAddresses()).then(console.log)
// newAddress(account, { cryptoCode: 'ADA' }).then(addr => console.log(addr))
// balance(account, 'ADA').then(b => console.log(b))
// getStatus(account, { toAddress: 'addr_test1qpfxxyax9wac0tft6jrmpzcdq286hna47g9eyklycggh6ej0jh9y5x8nspe86h7vesmkmlzz2xg6ascmhe9xfga4valqdp08vv', cryptoCode: 'ADA' }, new BN(1000000000)).then(console.log)
// sendCoins(account, { toAddress: 'addr_test1qqr585tvlc7ylnqvz8pyqwauzrdu0mxag3m7q56grgmgu7sxu2hyfhlkwuxupa9d5085eunq2qywy7hvmvej456flknswgndm3', cryptoAtoms: new BN(2000000), cryptoCode: 'ADA' }).then(console.log)

function sendCoins (account, tx, settings, operatorId, feeMultiplier) {
  const { toAddress, cryptoAtoms, cryptoCode } = tx
  const receiverAddress = [new AddressWallet(toAddress)]
  const amounts = [cryptoAtoms.toString()]

  return checkCryptoCode(cryptoCode)
    .then(() => getWallet(account))
    .then(wallet => wallet.sendPayment(account.passphrase, receiverAddress, amounts))
}

function getStatus (account, tx, requested, settings, operatorId) {
  const { toAddress, cryptoCode } = tx
  return checkCryptoCode(cryptoCode)
    .then(() => getWallet(account))
    .then(wallet => wallet.getTransactions())
    .then(txs => {
      // Assumes that the our receiver address was only used once
      const tx = _.head(_.filter(tx =>
        tx.direction === 'incoming' &&
        _.includes(toAddress, _.map(output => output.address)(tx.outputs))
      )(txs))
      if (tx) {
        const amount = new BN(_.find(output => output.address === toAddress)(tx.outputs).amount.quantity)
        // Should we care about rollbacks? As per my understanding 'in_ledger' state can be reverted to 'submitted'
        // and if ttl expires it can go to 'expired' state
        if (tx.status === 'in_ledger' && amount.gte(requested)) return { receivedCryptoAtoms: amount, status: 'confirmed' }
      }
      return { receivedCryptoAtoms: 0, status: 'notSeen' }
    })
}

/**
 * TODO: we should manage addresses internally, the problem lies in the possibility of consecutive cash-out
 * transactions with the same address, since the list of unused wallet addresses is only updated upon a on-chain tx
 */
function newAddress (account, info, tx, settings, operatorId) {
  return checkCryptoCode(info.cryptoCode)
    .then(() => getWallet(account))
    .then(wallet => wallet.getUnusedAddresses())
    .then(addresses => addresses.slice(0, 1))
}

// function getWalletPendingBalance (wallet) {
//   return wallet.getTransactions()
//     .then(txs => {
//       const getPendingTxs = (direction, txs) => _.filter(tx => !_.includes(tx.status, ['in_ledger']) && tx.direction === direction)(txs)
//       const sumBalance = _.sumBy(tx => tx.amount)
//       const incomingPendingTxs = getPendingTxs('incoming', txs)
//       const outgoingPendingTxs = getPendingTxs('outgoing', txs)
//       return sumBalance(incomingPendingTxs) - sumBalance(outgoingPendingTxs)
//     })
// }

function newFunding (account, cryptoCode, settings, operatorId) {
  return checkCryptoCode(cryptoCode)
    .then(() => getWallet(account))
    .then(wallet => {
      const promises = [
        newAddress(account),
        new BN(0), // is the pending balance insignificant or should we use something like getWalletPendingBalance?
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
  return walletServer.wallets()
    .then(wallets => walletServer.getShelleyWallet(_.find(wallet => wallet.id === account.walletId, wallets).id))
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
  sendCoins,
  newAddress,
  getStatus,
  newFunding,
  checkBlockchainStatus
}
