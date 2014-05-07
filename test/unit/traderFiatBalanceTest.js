/*global describe, it */
'use strict';

var assert = require('chai').assert;
var Trader = require('../../lib/trader.js');

var db = 'psql://lamassu:lamassu@localhost/lamassu-test';

var RATE = 101;
var CURRENCY = 'USD';
var SATOSHI_FACTOR = 1e8;
var LOW_BALANCE_MARGIN = 1.2;
var COMMISSION = 1.1;
var FINGERPRINT = '00:7A:5A:B3:02:F1:44:46:E2:EA:24:D3:A8:29:DE:22:BA:1B:F9:50';

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

    // We have 3 bitcoins, want to trade 1 bitcoin for 100 fiat
    trader.balance = {
      transferBalance: 3 * SATOSHI_FACTOR,
      tradeBalance: null
    };
    trader.rates[CURRENCY] = { rate: RATE };
    trader.rateInfo = {rates: {USD: {rate: RATE}}};
    var fiatBalance = trader.fiatBalance(FINGERPRINT);
    assert.equal(fiatBalance, (3 * RATE * COMMISSION / LOW_BALANCE_MARGIN));
  });

  it('should calculate balance correctly with transfer and trade exchange', function() {
    var trader = new Trader(db);
    trader.configure({
      exchanges: {
        plugins: {
          current: {
            transfer: 'blockchain',
            ticker: 'bitpay',
            trade: 'bitstamp'
          },
          settings: { blockchain: {}, bitpay: {}, bitstamp: {} }
        },
        settings: settings
      }
    });

    // We have 3 bitcoins in transfer, worth 3 * RATE * COMMISSION = 333.3
    // We have 150 USD in trade
    trader.balance = {
      transferBalance: 3 * SATOSHI_FACTOR,
      tradeBalance: 150
    };
    trader.rates[CURRENCY] = { rate: RATE };
    trader.rateInfo = {rates: {USD: {rate: RATE}}};
    var fiatBalance = trader.fiatBalance(FINGERPRINT);
    assert.equal(fiatBalance, 150 / LOW_BALANCE_MARGIN);
  });

  it('should calculate balance correctly with transfer and ' + 
      'trade exchange with different currencies', function() {
    var trader = new Trader(db);
    trader.configure({
      exchanges: {
        plugins: {
          current: {
            transfer: 'blockchain',
            ticker: 'bitpay',
            trade: 'bitstamp'
          },
          settings: { blockchain: {}, bitpay: {}, bitstamp: {} }
        },
        settings: settings
      }
    });

    // We have 6 bitcoins in transfer, worth 6 * RATE * COMMISSION = 666.6
    // We have 150 USD in trade, 1 USD = 4 ILS => 600 ILS in trade
    trader.balance = {
      transferBalance: 6 * SATOSHI_FACTOR,
      tradeBalance: 600
    };
    trader.rates = {USD: {rate: RATE}, ILS: {rate: RATE * 4} };
    trader.rateInfo = {rates: {USD: {rate: RATE}}};
    var fiatBalance = trader.fiatBalance(FINGERPRINT);
    assert.equal(fiatBalance, 600 / LOW_BALANCE_MARGIN);
  });

});

