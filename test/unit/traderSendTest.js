'use strict';

var assert = require('chai').assert;
var hock = require('hock');
var uuid = require('node-uuid').v4;
var Trader = require('../../lib/trader.js');
var PostgresqlInterface = require('../../lib/protocol/db/postgresql_interface.js');

var db = 'psql://lamassu:lamassu@localhost/lamassu-test';
var psqlInterface = new PostgresqlInterface(db);

var TRANSACTION_FEE = 1;
var FINGERPRINT = 'CB:3D:78:49:03:39:BA:47:0A:33:29:3E:31:25:F7:C6:4F:74:71:D7';
var TXID = '216dabdb692670bae940deb71e59486038a575f637903d3c9af601ddd48057fc';
var CURRENCY = 'USD';

describe('trader/send', function () {
  var trader = new Trader(psqlInterface);
  trader.config = {
    exchanges: {
      settings: {
        transactionFee: TRANSACTION_FEE
      }
    }
  };

  trader.tickerExchange = { ticker: function () { } };

  it('should call `sendBitcoins` on the transfer exchange', function (done) {
    var address = '1LhkU2R8nJaU8Zj6jB8VjWrMpvVKGqCZ64';
    var txId = uuid();
    var satoshis = 1337;

    trader.transferExchange = {
      sendBitcoins: function (address_, satoshis_, transactionFee, callback) {
        assert.equal(address, address_);
        assert.equal(satoshis, satoshis_);
        assert.equal(transactionFee, TRANSACTION_FEE);
        callback(null, TXID);
      }
    };

    trader.sendBitcoins(FINGERPRINT, {
      fiat: 100,
      txId: txId,
      currencyCode: CURRENCY,
      toAddress: address,
      satoshis: satoshis
    }, function (err, txId) {
      assert.notOk(err);
      assert.equal(txId, TXID);
      done();
    });
  });
});
