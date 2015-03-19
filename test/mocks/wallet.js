'use strict';

module.exports = {
  SUPPORTED_MODULES: ['wallet'],
  NAME: 'Mock Wallet',

  config: function config() {},
  balance: function balance(callback) {
    calls.balance++;

    callback(null, {
      BTC: 1e8
    });
  },
  sendBitcoins: function(addr, satoshis, fee, cb) {
    calls.send = true;

    if (satoshis <= 1e8) cb(null, TX_HASH);
    else {
      var e = new Error('Insufficient funds');
      e.name = 'InsufficientFunds';
      cb(e);
    }
  },
  newAddress: function(info, cb) {
    cb(null, ADDR);
  }
};


// mock stuff
var calls = {
  balance: 0,
  send: false
};
var ADDR = module.exports.ADDR = '12sENwECeRSmTeDwyLNqwh47JistZqFmW8';
var TX_HASH = module.exports.TX_HASH = '1c12443203a48f42cdf7b1acee5b4b1c1fedc144cb909a3bf5edbffafb0cd204';

module.exports.getBalanceCalls = function() {
  return calls.balance;
};
module.exports.wasSendCalled = function() {
  return calls.send;
};
