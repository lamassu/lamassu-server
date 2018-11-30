class WalletAdapter {
  constructor (wallet, account) {
    this.wallet = wallet
    this.account = account
  }

  newAddress (settings, info) {
    return this.wallet.newAddress(this.account, info)
  }

  getStatus (settings, tx) {
    return this.wallet.getStatus(this.account, tx.toAddress, tx.cryptoAtoms, tx.cryptoCode)
  }

  balance () {
    return this.wallet.balance.apply(this.wallet, arguments)
  }

  sendCoins () {
    return this.wallet.sendCoins.apply(this.wallet, arguments)
  }

  newFunding () {
    return this.wallet.newFunding.apply(this.wallet, arguments)
  }

  sweep () {
    return this.wallet.sweep.apply(this.wallet, arguments)
  }

  get supportsHd () {
    return this.wallet.supportsHd
  }

  isStrictAddress (cryptoCode, toAddress) {
    if (!this.wallet.isStrictAddress) return true
    return this.wallet.isStrictAddress(cryptoCode, toAddress)
  }
}

module.exports = WalletAdapter
