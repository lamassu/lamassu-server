'use strict';

var assert = require('chai').assert;
var hock = require('hock');
var uuid = require('node-uuid').v4;
var Trader = require('../../lib/trader.js');
var PostgresqlInterface = require('../../lib/postgresql_interface.js');

var db = 'psql://lamassu:lamassu@localhost/lamassu-test';
var psqlInterface = new PostgresqlInterface(db);

var TRANSACTION_FEE = 1;
var FINGERPRINT = 'CB:3D:78:49:03:39:BA:47:0A:33:29:3E:31:25:F7:C6:4F:74:71:D7';
var TXID = '216dabdb692670bae940deb71e59486038a575f637903d3c9af601ddd48057fc';
var ADDRESS = '1LhkU2R8nJaU8Zj6jB8VjWrMpvVKGqCZ64';
var SATOSHIS = 1337;
var CURRENCY = 'USD';

var OUR_TXID = uuid();

describe('trader/send', function () {
  var trader = new Trader(psqlInterface);
  trader.config = {
    exchanges: {
      settings: {
        transactionFee: TRANSACTION_FEE
      }
    }
  };

  trader.pollRate = function () {};

  it('should call `sendBitcoins` on the transfer exchange', function (done) {
    trader.transferExchange = {
      sendBitcoins: function (address, satoshis, transactionFee, callback) {
        assert.equal(ADDRESS, address);
        assert.equal(SATOSHIS, satoshis);
        assert.equal(transactionFee, TRANSACTION_FEE);
        callback(null, TXID);
      },
      balance: function () {}
    };

    trader.sendBitcoins(FINGERPRINT, {
      fiat: 100,
      txId: OUR_TXID,
      currencyCode: CURRENCY,
      toAddress: ADDRESS,
      satoshis: SATOSHIS
    }, function (err, txId) {
      assert.notOk(err);
      assert.equal(txId, TXID);
      done();
    });
  });

  it('should not call `sendBitcoins` on the transfer exchange with same send', function (done) {
    trader.transferExchange = {
      sendBitcoins: function () {
        throw new Error('This should not have been called');
      },
      balance: function () {}
    };

    trader.sendBitcoins(FINGERPRINT, {
      fiat: 100,
      txId: OUR_TXID,
      currencyCode: CURRENCY,
      toAddress: ADDRESS,
      satoshis: SATOSHIS
    }, function (err, txId) {
      assert.notOk(err);
      assert.equal(txId, TXID);
      done();
    });
  });
});
