/* global describe, it, before, afterEach */

'use strict';

var _       = require('lodash');
var should  = require('chai').should();
var mockery =  require('mockery');

var config = require('./mocks/config.json');
var CONFIG = _.cloneDeep(config);
function requireFreshConfig() {
  return _.cloneDeep(CONFIG);
}

var walletMock = require('./mocks/wallet');
var tickerMock = require('./mocks/ticker');
var traderMock = require('./mocks/trader');
var verifierMock = require('./mocks/verifier');
var infoMock = require('./mocks/info');

mockery.registerMock('lamassu-mockWallet', walletMock);
mockery.registerMock('lamassu-mockTicker', tickerMock);
mockery.registerMock('lamassu-mockTrader', traderMock);
mockery.registerMock('lamassu-mockVerifier', verifierMock);
mockery.registerMock('lamassu-mockInfo', infoMock);

describe('Plugins', function() {
  var plugins = null;

  before(function() {
    mockery.enable({
      useCleanCache: true,
      warnOnReplace: false,
      warnOnUnregistered: false
    });

    plugins = require('../lib/plugins');
  });

  afterEach(function() {
    config = requireFreshConfig();
  });

  it('should properly load', function() {
    should.exist(plugins);
  });

  it('should throw when db is not provided', function() {
    plugins.init.should.throw(/db.*required/);
  });

  it('should throw when invalid balance margin', function() {
    config.exchanges.settings.lowBalanceMargin = 0.99;

    function configurer() {
      plugins.configure(config);
    }
    configurer.should.throw(/lowBalanceMargin/);
  });

  it('should throw when module is not installed', function() {
    config.exchanges.plugins.current.ticker = 'inexistent-plugin';

    function configurer() {
      plugins.configure(config);
    }
    configurer.should.throw(/module.*not installed/);
  });

  it('should throw when used plugin has no SUPPORTED_MODULES', function() {
    var tmp = tickerMock.SUPPORTED_MODULES;
    delete tickerMock.SUPPORTED_MODULES;

    function configurer() {
      plugins.configure(config);
    }
    configurer.should.throw(/required.*SUPPORTED_MODULES/);

    tickerMock.SUPPORTED_MODULES = tmp;
  });

  it('should throw when used plugin has required method missing', function() {
    var tmp = tickerMock.ticker;
    delete tickerMock.ticker;

    function configurer() {
      plugins.configure(config);
    }
    configurer.should.throw(/fails.*implement.*method/);

    tickerMock.ticker = tmp;
  });

  describe('should configure all enabled plugins', function() {
    var confList = {};

    before(function() {
      function configTest(name) {
        return function config(localConfig) {
          should.exist(config);
          /* jshint expr: true */
          localConfig.should.be.an.Object;
          /* jshint expr: false */
          confList[name] = config;
        };
      }

      walletMock.config   = configTest('wallet');
      tickerMock.config   = configTest('ticker');
      traderMock.config   = configTest('trader');
      verifierMock.config = configTest('verifier');
      infoMock.config     = configTest('info');

      plugins.configure(config);
    });

    ['wallet', 'ticker', 'trader', 'verifier', 'info'].forEach(function(name) {
      it('should configure ' + name, function() {
        confList.should.have.property(name);
        should.exist(confList[name]);
        /* jshint expr: true */
        confList[name].should.be.an.Object;
        /* jshint expr: false */
      });
    });

    it('should return config', function() {
      var config = plugins.getCachedConfig();
      should.exist(config);
      /* jshint expr: true */
      config.should.be.an.Object;
      /* jshint expr: false */

    });

  });

  describe('Ticker', function() {
    it('should have called .ticker() at least once', function() {
      tickerMock.getTickerCalls().should.be.at.least(1);
    });

    it('should return last ticker price', function() {
      var rate = plugins.getDeviceRate();
      should.exist(rate);
      /* jshint expr: true */
      rate.should.be.an.Object;
      /* jshint expr: false */
      rate.should.have.property('currency');
      rate.should.have.property('rates');

      var rates = rate.rates;
      /* jshint expr: true */
      rate.should.be.an.Object;
      /* jshint expr: false */
      rates.should.have.property('ask');
      rates.should.have.property('bid');
    });
  });

  describe('Wallet', function() {

    var db = require('./mocks/db');

    before(function() {
      plugins.init(db);
    });

    it('should have called .balance() at least once', function() {
      walletMock.getBalanceCalls().should.be.at.least(1);
    });

    it('should return BTC balance', function() {
      var balance = plugins.getBalance();
      should.exist(balance);
      /* jshint expr: true */
      balance.should.be.an.Object;
      /* jshint expr: false */
      balance.should.have.property('BTC');
      balance.BTC.should.equal(1e8);
    });

    it('should return fiat balance', function() {
      var fiatBalance = plugins.fiatBalance();
      should.exist(fiatBalance);
      /* jshint expr: true */
      fiatBalance.should.be.a.Number;
      /* jshint expr: false */
      fiatBalance.should.be.below(999);
    });

    describe('Send Bitcoins', function() {

      before(function() {
        plugins.trade({currency: 'USD', satoshis: 1e7}, db.FINGERPRINT_NEW);
      });

      it('should send bitcoins successfully', function(done) {
        var txDetails = {
          txId: 1,
          toAddress: walletMock.ADDR,
          satoshis: 1e7
        };

        plugins.sendBitcoins(db.FINGERPRINT_NEW, txDetails, function(err,
            response) {
          should.not.exist(err);
          should.exist(response);
          /* jshint expr: true */
          response.should.be.an.Object;
          response.should.have.property('statusCode');
          response.statusCode.should.equal(201);
          /* jshint expr: false */

          done();
        });
      });

      function notEnoughFundsTx(done) {
        db.resetCalls();
        var txDetails = {
          txId: 2,
          toAddress: walletMock.ADDR,
          satoshis: 1e9
        };
        plugins.sendBitcoins(db.FINGERPRINT_FUNDS, txDetails, function(err,
            txHash) {
          should.exist(err);
          err.should.be.instanceof(Error);
          err.name.should.equal('InsufficientFunds');

          /* jshint expr: true */
          walletMock.wasSendCalled().should.be.true;
          db.wasStatusReported().should.be.false;
          /* jshint expr: false */

          done();
        });
      }

      // // this fail comes from external plugin
      // it('should fail when not enough funds', function(done) {
      //   notEnoughFundsTx(function() {

      //     /* jshint expr: true */
      //     db.wasErrorReported().should.be.true;
      //     /* jshint expr: false */
      //     done();
      //   });
      // });

      // // this once comes from plugins.js
      // it('should fail again', function(done) {
      //   notEnoughFundsTx(function() {

      //     /* jshint expr: true */
      //     db.wasErrorReported().should.be.false; // should not report error again
      //     /* jshint expr: false */
      //     done();
      //   });
      // });
    });

  });

  describe('Trader', function() {});
});
