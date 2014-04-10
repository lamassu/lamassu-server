'use strict';

var assert = require('chai').assert;

var LamassuConfig = require('lamassu-config');
var con = 'psql://lamassu:lamassu@localhost/lamassu';
var config = new LamassuConfig(con);

var api = require('../lib/protocol/api/api.js');
var RATE = 100;
var SATOSHI_FACTOR = Math.pow(10, 8);
var cfg;

describe('fiatBalance test', function() {
  before(function(done) {
    config.load(function(err, result) {
      assert.isNull(err);
      cfg = result.exchanges;
      api.init(cfg);
      done();
    });
  });

  after(function(done) {
    config.end();
    done();
  });

  it('should calculate balance correctly with transfer exchange only', function() {
    // We have 2 bitcoins, want to trade 1 bitcoin for 100 fiat
    var balance = api.fiatBalance(RATE / cfg.settings.commission, {
      transferBalance: 2 * SATOSHI_FACTOR,
      tradeBalance: null
    }, 1 * SATOSHI_FACTOR, 100);
    assert.equal(balance, 100 / cfg.settings.lowBalanceMargin);
  });

  it('should calculate balance correctly with both exchanges (trade > transfer)', function() {
    // We have 2 bitcoins for transfer, 2000 fiat for trade, want to trade 1
    // bitcoin for 100 fiat
    var balance = api.fiatBalance(RATE / cfg.settings.commission, {
      transferBalance: 2 * SATOSHI_FACTOR,
      tradeBalance: 2000
    }, 1 * SATOSHI_FACTOR, 100);
    assert.equal(balance, 100 / cfg.settings.lowBalanceMargin);
  });

  it('should calculate balance correctly with both exchanges (transfer > trade)', function() {
    // We have 2 bitcoins for transfer, 150 fiat for trade, want to trade 1
    // bitcoin for 100 fiat
    var balance = api.fiatBalance(RATE / cfg.settings.commission, {
      transferBalance: 2 * SATOSHI_FACTOR,
      tradeBalance: 150
    }, 1 * SATOSHI_FACTOR, 100);
    assert.equal(balance, 50 / cfg.settings.lowBalanceMargin);
  });
});
