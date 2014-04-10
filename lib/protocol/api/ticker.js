'use strict';

require('date-utils');
var winston = require('winston');
var logger = new (winston.Logger)({transports:[new (winston.transports.Console)()]});

var _tickerExchange;
var _api;
var _rates = {};

var _pollRate = function(currency) {
  logger.info('polling for rate...');
  _tickerExchange.ticker(currency, function(err, rate) {
    if (err) return;
    logger.info('Rate update:', rate);
    _rates[currency] = {rate: rate, timestamp: new Date()};
  });
};

exports.init = function(config, api, tickerExchange) {
  _api = api;
  _tickerExchange = tickerExchange;

  _pollRate(config.settings.currency);
  setInterval(function () {
    _pollRate(config.settings.currency);
  }, 60 * 1000);
};

exports.rate = function(currency) {
  if (!_rates[currency]) return null;
  return _rates[currency];
};
