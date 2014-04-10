'use strict';

var _transferExchange;
var _tradeExchange;
var _api;
var _config;
var _balance = null;
var _balanceTriggers = [];

var winston = require('winston');
var logger = new (winston.Logger)({transports:[new (winston.transports.Console)()]});

var async = require('async');

exports.init = function(config, api, transferExchange, tradeExchange) {
  _api = api;
  _config = config;

  _transferExchange = transferExchange;
  _tradeExchange = tradeExchange;

  _balanceTriggers = [function (cb) { _transferExchange.balance(cb); }];

  if (tradeExchange)
    _balanceTriggers.push(function(cb) { _tradeExchange.balance(cb); });

  _pollBalance();
  setInterval(_pollBalance, 60 * 1000);
};

exports.balance = function balance() {
  return _balance;
};

exports.triggerBalance = _pollBalance;

function _pollBalance() {
  logger.info('collecting balance');
  async.parallel(_balanceTriggers, function(err, results) {
    if (err) return;

    _balance = {
      transferBalance: results[0],
      tradeBalance: results.length === 2 ? results[1] : null,
      timestamp: Date.now()    
    };
    logger.info('Balance update:', _balance);
  });
}
