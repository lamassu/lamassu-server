'use strict';

module.exports = {
  SUPPORTED_MODULES: [ 'ticker' ],
  NAME: 'Mock Ticker',

  config: function config() {},
  ticker: function ticker(currency, callback) {
    tickerCalls++;

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


// mock stuff
var tickerCalls = 0;
module.exports.getTickerCalls = function() {
  return tickerCalls;
}
