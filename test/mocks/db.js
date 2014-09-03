'use strict';

var FINGERPRINT_NEW = 'XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX';
var FINGERPRINT_FUNDS = 'YY:YY:YY:YY:YY:YY:YY:YY:YY:YY:YY:YY:YY:YY:YY:YY:YY:YY:YY:YY';

var txs = {};


module.exports = {
  FINGERPRINT_NEW: FINGERPRINT_NEW,
  FINGERPRINT_FUNDS: FINGERPRINT_FUNDS,
  summonTransaction: function(fingerprint, tx, cb) {
    var cachedTx = txs[tx.txId];
    if (cachedTx) cb(null, cachedTx);
    else {
      txs[tx.txId] = tx;
      cb(null, null);
    }
  },
  reportTransactionError: function(tx, err, status) {
    txs[tx.txId].err = err;
    txs[tx.txId].status = status;
    calls.fail = true;
  },
  completeTransaction: function(tx, txHash) {
    calls.status = true;
  }
};


var calls = {};
module.exports.wasErrorReported = function() {
  return calls.fail;
};
module.exports.wasStatusReported = function() {
  return calls.status;
};
module.exports.resetCalls = function() {
  calls = {
    status: false,
    fail: false
  };
};
module.exports.resetCalls();
