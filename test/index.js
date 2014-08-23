/* global describe, it, before, afterEach */

'use strict';

var _       = require('lodash');
var should  = require('chai').should();
var mockery =  require('mockery');


var config = require('./mocks/config');
var CONFIG = _.cloneDeep(config);
function requireFreshConfig() {
  return _.cloneDeep(CONFIG);
}


var walletMock = require('./mocks/wallet');
var tickerMock = require('./mocks/ticker');
var traderMock = require('./mocks/trader');
var verifierMock = require('./mocks/verifier');

mockery.registerMock('lamassu-mockWallet', walletMock);
mockery.registerMock('lamassu-mockTicker', tickerMock);
mockery.registerMock('lamassu-mockTrader', traderMock);
mockery.registerMock('lamassu-mockVerifier', verifierMock);


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
          /* jshint expr: true */
          confList[name] = config;
        };
      }

      walletMock.config   = configTest('wallet');
      tickerMock.config   = configTest('ticker');
      traderMock.config   = configTest('trader');
      verifierMock.config = configTest('verifier');

      plugins.configure(config);
    });

    ['wallet', 'ticker', 'trader', 'verifier'].forEach(function(name) {
      it('should configure ' + name, function() {
        confList.should.have.property(name);
        should.exist(confList[name]);
        /* jshint expr: true */
        confList[name].should.be.an.Object;
        /* jshint expr: true */
      });
    });

  });

  this.timeout(9000);

  describe('Ticker', function() {
    it('should have .ticker() called at least once', function() {
      tickerMock.tickerCalls.should.be.at.least(1);
    });

  });

});

