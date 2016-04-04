var Web3 = require('web3')

var web3 = new Web3()

if (!web3.isConnected()) {
  web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'))
}

// Note: it's still called sendBitcoins for backwards compatibility, but this
// is for any currency
exports.sendBitcoins = function sendBitcoins (address, satoshis, fee, callback) {
  web3.eth.sendTransaction({
    to: address,
    value: satoshis
  }, callback)
}

exports.balance = function balance (cb) {
  var coinbase = web3.eth.coinbase
  web3.eth.getBalance(coinbase, 'pending', cb)
}

exports.newAddress = function newAddress (info, callback) {
  throw new Error('Not implemented')
}
