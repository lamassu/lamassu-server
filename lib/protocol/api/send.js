'use strict';

var _transferExchange;
var _api;
var _config;
var _conString = process.env.DATABASE_URL || 'postgres://lamassu:lamassu@localhost/lamassu';
var _db = require('../db/postgresql_interface').factory(_conString);

exports.init = function(config, api, transferExchange) {
  _api = api;
  _config = config;
  _transferExchange = transferExchange;
};

exports.setDomain = function(domain) {
  _transferExchange.setDomain(domain);
};

exports.sendBitcoins = function sendBitcoins(deviceFingerprint, tx, cb) {
  _db.summonTransaction(deviceFingerprint, tx, function (err, isNew, txHash) {
    if (err) return cb(err);
    if (isNew) return _transferExchange.sendBitcoins(tx.toAddress, tx.satoshis, 
          _config.settings.transactionFee, function(err, txHash) {
        if (err) {
          _db.reportTransactionError(tx, err);
          return cb(err);
        }
        cb(null, txHash);
        _db.completeTransaction(tx, txHash);
        _api.triggerBalance();
      });

    // transaction exists, but txHash might be null, 
    // in which case ATM should continue polling  
    cb(null, txHash);
  });  
};
