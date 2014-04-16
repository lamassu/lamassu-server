'use strict';

var assert = require('chai').assert;
var Trader = require('../../lib/trader.js');
var PostgresqlInterface = require('../../lib/postgresql_interface.js');

var db = 'psql://lamassu:lamassu@localhost/lamassu-test';
var psqlInterface = new PostgresqlInterface(db);

describe('trader/api', function () {
  it('should throw when trying to create a trader with no DB', function () {
    assert.throws(function () {
      new Trader();
    });
  });

  it('should throw when trying to configure a trader with `lowBalanceMargin` < 1', function () {
    var trader = new Trader(psqlInterface);
    assert.throws(function () {
      trader.configure({
        exchanges: {
          settings: {
            lowBalanceMargin: 0.8
          }
        }
      });
    });
  });

  it('should find and instantiate ticker and trade exchanges', function () {
    var trader = new Trader(psqlInterface);
    trader.configure({
      exchanges: {
        plugins: {
          current: {
            ticker: 'bitpay',
            transfer: 'blockchain'
          },
          settings: {
            bitpay: {},
            blockchain: {}
          }
        },
        settings: {
          currency: 'USD',
          lowBalanceMargin: 2
        }
      }
    });

    assert.ok(trader.tickerExchange);
    assert.ok(trader.transferExchange);
  });
});
