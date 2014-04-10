'use strict';

require('date-utils');

//var async = require('async');
var winston = require('winston');
var logger = new (winston.Logger)({transports:[new (winston.transports.Console)()]});
var path = require('path');

var _transferExchange;
var _tickerExchange;
var _tradeExchange;
var _rates = {};
var _config;
var _commission;
var _config;
var SATOSHI_FACTOR = Math.pow(10, 8);

exports.ticker = require('./ticker');
exports.trade = require('./trade');
exports.send = require('./send');
exports.balance = require('./balance');
exports._tradeExchange = null;
exports._transferExchange = null;

exports.findExchange = function (name) {
  var exchange;

  try {
    exchange = require('lamassu-' + name);
  } catch (err) {
    if (!err.message.match(/Cannot find module/)) throw err;
    exchange = require(path.join(path.dirname(__dirname), 'exchanges', name));
  }

  return exchange;
};

exports.findTicker = function (name) {
  var exchange = exports.findExchange(name);
  return exchange.ticker || exchange;
};

exports.findTrader = function (name) {
  var exchange = exports.findExchange(name);
  return exchange.trader || exchange;
};

exports.findWallet = function (name) {
  var exchange = exports.findExchange(name);
  return exchange.wallet || exchange;
};

exports.triggerBalance = function triggerBalance() {
  this.balance.triggerBalance();
};

exports.init = function(config) {
  _config = config;

  if (config.settings.lowBalanceMargin < 1) {
    throw new Error('`settings.lowBalanceMargin` has to be >= 1');
  }

  var tickerExchangeCode = config.plugins.current.ticker;
  var tickerExchangeConfig = config.plugins.settings[tickerExchangeCode] || {};
  tickerExchangeConfig.currency = config.settings.currency;
  _tickerExchange = exports.findTicker(tickerExchangeCode).factory(tickerExchangeConfig);

  var tradeExchangeCode = config.plugins.current.trade;
  if (tradeExchangeCode) {
    var tradeExchangeConfig = config.plugins.settings[tradeExchangeCode];
    _tradeExchange = exports.findTrader(tradeExchangeCode).factory(tradeExchangeConfig);
  }

  var transferExchangeCode = config.plugins.current.transfer;
  var transferExchangeConfig = config.plugins.settings[transferExchangeCode];
  _commission = config.settings.commission;
  _transferExchange = exports.findWallet(transferExchangeCode).factory(transferExchangeConfig);

  var doRequestTradeExchange = _tradeExchange && tradeExchangeCode !== transferExchangeCode;

  exports._tradeExchange = _tradeExchange;
  exports._transferExchange = _transferExchange;
  exports.ticker.init(config, exports, _tickerExchange);
  exports.trade.init(config, exports, _tradeExchange, exports.ticker);
  exports.send.init(config, exports, _transferExchange, exports.ticker);
  exports.balance.init(config, exports, _transferExchange,
                       doRequestTradeExchange ? _tradeExchange : null);
};

/**
 * return fiat balance
 *
 * in input to this function, balance has the following parameters...
 *
 * balance.transferBalance - in satoshis
 * balance.tradeBalance    - in USD
 *
 * Have added conversion here, but this really needs to be thought through, lamassu-bitstamp should perhaps
 * return balance in satoshis
 */
exports.fiatBalance = function(rate, balance, transferSatoshis, tradeFiat, callback) {
  if (!rate || !balance) return 0;

  // The rate is actually our commission times real rate.
  rate = _commission * rate;

  // `lowBalanceMargin` is our safety net. It's a number > 1, and we divide
  // all our balances by it to provide a safety margin.
  var lowBalanceMargin = _config.settings.lowBalanceMargin;

  // `balance.transferBalance` is the balance of our transfer account (the one
  // we use to send Bitcoins to clients). `transferSatoshis` is the number
  // of satoshis we're expected to send for this transaction. By subtracting
  // them, we get `adjustedTransferBalance`, amount of satoshis we'll have
  // after the transaction.
  var adjustedTransferBalance = balance.transferBalance - transferSatoshis;
  
  // Since `adjustedTransferBalance` is in Satoshis, we need to turn it into
  // Bitcoins and then fiat to learn how much fiat currency we can exchange.
  //
  // Unit validity proof: [ $ ] = [ (B * 10^8) / 10^8 * $/B ]
  //                      [ $ ] = [ B * $/B ]
  //                      [ $ ] = [ $ ]
  var fiatTransferBalance = ((adjustedTransferBalance / SATOSHI_FACTOR) * rate) / lowBalanceMargin;

  // If this server is also configured to trade received fiat for Bitcoins,
  // we also need to calculate if we have enough funds on our trade exchange.
  if (balance.tradeBalance === null) return fiatTransferBalance;
  var tradeBalance = balance.tradeBalance;

  // We need to secure `tradeFiat` (amount of fiat in this transaction) and
  // enough fiat to cover our trading queue (trades aren't executed immediately).
  var adjustedFiat = tradeFiat + exports.trade.queueFiatBalance(rate);

  // So we subtract `adjustedFiat` from `tradeBalance` and again, apply
  // `lowBalanceMargin`.
  var fiatTradeBalance = (tradeBalance - adjustedFiat) / lowBalanceMargin;

  // And we return the smallest number.
  return Math.min(fiatTransferBalance, fiatTradeBalance);
};


