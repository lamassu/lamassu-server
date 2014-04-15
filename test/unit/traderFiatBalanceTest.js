'use strict';

var assert = require('chai').assert;
var Trader = require('../../lib/trader.js');
var PostgresqlInterface = require('../../lib/protocol/db/postgresql_interface.js');

var db = 'psql://lamassu:lamassu@localhost/lamassu-test';
var psqlInterface = new PostgresqlInterface(db);

var RATE = 100;
var CURRENCY = 'USD';
var SATOSHI_FACTOR = Math.pow(10, 8);
var LOW_BALANCE_MARGIN = 1.2;
var COMMISSION = 1.1;

var settings = {
  currency: CURRENCY,
  lowBalanceMargin: LOW_BALANCE_MARGIN,
  commission: COMMISSION
};

describe('trader/fiatBalance', function() {
  it('should calculate balance correctly with transfer exchange only', function() {
    var trader = new Trader(db);
    trader.configure({
      exchanges: {
        plugins: {
          current: {
            transfer: 'blockchain',
            ticker: 'bitpay'
          },
          settings: { blockchain: {}, bitpay: {} }
        },
        settings: settings
      }
    });

    // We have 2 bitcoins, want to trade 1 bitcoin for 100 fiat
    trader.balance = {
      transferBalance: 2 * SATOSHI_FACTOR,
      tradeBalance: null
    };
    trader.rates[CURRENCY] = { rate: RATE };

    var balance = trader.fiatBalance(1 * SATOSHI_FACTOR, 100);
    assert.equal(balance, (100 / LOW_BALANCE_MARGIN) * COMMISSION);
  });
});
