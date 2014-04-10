'use strict';

require('date-utils');
var winston = require('winston');
var _ = require('underscore');
var logger = new (winston.Logger)({transports:[new (winston.transports.Console)()]});

var _tradeExchange;
var _ticker;
var _tradeQueue = [];
var _api;
var _config;

var SATOSHI_FACTOR = Math.pow(10, 8);

var _consolidateTrades = function() {
  var queue = _tradeQueue;
  var tradeRec = {
    fiat: 0,
    satoshis: 0,
    currency: 'USD'
  };

  while (true) {
    var lastRec = queue.shift();
    if (!lastRec) {
      break;
    }
    tradeRec.fiat += lastRec.fiat;
    tradeRec.satoshis += lastRec.satoshis;
    tradeRec.currency = lastRec.currency;
  }
  return tradeRec;
};



/**
 * TODO: add error reporting
 */
var _purchase = function(trade) {
  _ticker.rate(trade.currency, function(err, rate) {
    _tradeExchange.purchase(trade.satoshis, rate, function(err) {
      _api.triggerBalance();
    });
  });
};

exports.init = function(config, api, tradeExchange, ticker) {
  _config = config;
  _api = api;
  _tradeExchange = tradeExchange;
  _ticker = ticker;

  var interval = setInterval(function() {
    exports.executeTrades();
  }, _config.settings.tradeInterval);
  interval.unref();
};

exports.trade = function(fiat, satoshis, currency, cb) {
  _tradeQueue.push({fiat: fiat, satoshis: satoshis, currency: currency});
  cb(null);
};

exports.queueFiatBalance = function(exchangeRate) {
  var satoshis = _.reduce(_tradeQueue, function(memo, rec) {
    return memo + rec.satoshis;
  }, 0);
  return (satoshis / SATOSHI_FACTOR) * exchangeRate;
};

exports.executeTrades = function() {
  if (!_tradeExchange) return;

  logger.info('checking for trades');

  if (!_config.plugins.current.trade) {
    logger.info('NO ENGINE');
    return;
  }

  var trade = _consolidateTrades();
  logger.info('consolidated: ' + JSON.stringify(trade));

  if (trade.fiat === 0) {
    logger.info('reject fiat 0');
    return;
  }

  if (trade.fiat < _config.settings.minimumTradeFiat) {
    // throw it back in the water
    logger.info('reject fiat too small');
    _tradeQueue.unshift(trade);
    return;
  }

  logger.info('making a trade: %d', trade.satoshis / Math.pow(10,8));
  _purchase(trade);
};
