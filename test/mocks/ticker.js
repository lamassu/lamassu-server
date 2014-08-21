'use strict';

module.exports = {
  SUPPORTED_MODULES: [ 'ticker' ],
  NAME: 'Mock Ticker',

  tickerCalls: 0,

  config: function() {},
  ticker: function(currency, callback) {
    this.tickerCalls++;

    var out = {};
    out[currency] = {
      currency: currency,
      rates: {
        ask: 1001.0,
        bid: 999.0
      }
    };
    callback(null, out);
  }
};
