'use strict';

var path = require('path');
var async = require('async');
var winston = require('winston');

var SATOSHI_FACTOR = Math.pow(10, 8);

var Trader = module.exports = function (db) {
  if (!db) {
    throw new Error('`db` is required');
  }

  this.db = db;
  this.rates = {};
  this.logger = new (winston.Logger)({
    transports: [new (winston.transports.Console)()]
  });

  this._tradeQueue = [];
};

Trader.prototype._findExchange = function (name) {
  var exchange;

  try {
    exchange = require('lamassu-' + name);
  } catch (err) {
    if (!err.message.match(/Cannot find module/)) {
      throw err;
    }

    exchange = require(path.join(path.dirname(__dirname), 'exchanges', name));
  }

  return exchange;
};

Trader.prototype._findTicker = function (name) {
  var exchange = Trader.prototype._findExchange(name);
  return exchange.ticker || exchange;
};

Trader.prototype._findTrader = function (name) {
  var exchange = Trader.prototype._findExchange(name);
  return exchange.trader || exchange;
};

Trader.prototype._findWallet = function (name) {
  var exchange = Trader.prototype._findExchange(name);
  return exchange.wallet || exchange;
};

Trader.prototype._tradeQueueFiatBalance = function (exchangeRate) {
  var satoshis = this._tradeQueue.reduce(function (memo, rec) {
    return memo + rec.satoshis;
  }, 0);
  return (satoshis / SATOSHI_FACTOR) * exchangeRate;
};

Trader.prototype._consolidateTrades = function () {
  var queue = this._tradeQueue;

  var tradeRec = {
    fiat: 0,
    satoshis: 0,
    currency: this.config.exchanges.settings.currency
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

Trader.prototype._purchase = function (trade) {
  var self = this;
  var rate = self.rate(trade.currency);
  self.tradeExchange.purchase(trade.satoshis, rate, function (err) {
    console.dir(arguments);
    // XXX: don't ignore purchase errors
    self.pollBalance();
  });
};

Trader.prototype.configure = function (config) {
  if (config.exchanges.settings.lowBalanceMargin < 1) {
    throw new Error('`settings.lowBalanceMargin` has to be >= 1');
  }

  var tickerExchangeCode = config.exchanges.plugins.current.ticker;
  var tickerExchangeConfig = config.exchanges.plugins.settings[tickerExchangeCode] || {};
  tickerExchangeConfig.currency = config.exchanges.settings.currency;
  this.tickerExchange = this._findTicker(tickerExchangeCode).factory(tickerExchangeConfig);

  var tradeExchangeCode = config.exchanges.plugins.current.trade;
  if (tradeExchangeCode) {
    var tradeExchangeConfig = config.exchanges.plugins.settings[tradeExchangeCode];
    this.tradeExchange = this._findTrader(tradeExchangeCode).factory(tradeExchangeConfig);
  }

  var transferExchangeCode = config.exchanges.plugins.current.transfer;
  var transferExchangeConfig = config.exchanges.plugins.settings[transferExchangeCode];
  this.transferExchange = this._findWallet(transferExchangeCode).factory(transferExchangeConfig);

  this.config = config;

  this.pollBalance();
  this.pollRate();
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
Trader.prototype.fiatBalance = function (transferSatoshis, tradeFiat) {
  var rate = this.rate(this.config.exchanges.settings.currency).rate;
  var balance = this.balance;
  var commission = this.config.exchanges.settings.commission;

  if (!rate || !balance) {
    return 0;
  }

  // The rate is actually our commission times real rate.
  rate = commission * rate;

  // `lowBalanceMargin` is our safety net. It's a number > 1, and we divide
  // all our balances by it to provide a safety margin.
  var lowBalanceMargin = this.config.exchanges.settings.lowBalanceMargin;

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
  var adjustedFiat = tradeFiat + this._tradeQueueFiatBalance(rate);

  // So we subtract `adjustedFiat` from `tradeBalance` and again, apply
  // `lowBalanceMargin`.
  var fiatTradeBalance = (tradeBalance - adjustedFiat) / lowBalanceMargin;

  // And we return the smallest number.
  return Math.min(fiatTransferBalance, fiatTradeBalance);
};

Trader.prototype.sendBitcoins = function (deviceFingerprint, tx, cb) {
  var self = this;

  self.db.summonTransaction(deviceFingerprint, tx, function (err, isNew, txHash) {
    if (err) {
      return cb(err);
    }

    if (isNew) {
      return self.transferExchange.sendBitcoins(
        tx.toAddress,
        tx.satoshis,
        self.config.exchanges.settings.transactionFee,
        function(err, txHash) {
          if (err) {
            self.db.reportTransactionError(tx, err);
            return cb(err);
          }

          cb(null, txHash);
          self.db.completeTransaction(tx, txHash);
          self.pollRate();
        }
      );
    }

    // transaction exists, but txHash might be null, 
    // in which case ATM should continue polling  
    cb(null, txHash);
  });
};

Trader.prototype.trade = function (fiat, satoshis, currency, callback) {
  this._tradeQueue.push({fiat: fiat, satoshis: satoshis, currency: currency});
  callback(null);
};

Trader.prototype.executeTrades = function () {
  if (!this.tradeExchange) return;

  this.logger.info('checking for trades');

  var trade = this._consolidateTrades();
  this.logger.info('consolidated: ', JSON.stringify(trade));

  if (trade.fiat === 0) {
    this.logger.info('rejecting 0 trade');
    return;
  }

  if (trade.fiat < this.config.exchanges.settings.minimumTradeFiat) {
    // throw it back in the water
    this.logger.info('reject fiat too small');
    this._tradeQueue.unshift(trade);
    return;
  }

  this.logger.info('making a trade: %d', trade.satoshis / Math.pow(10, 8));
  this._purchase(trade);
};

Trader.prototype.startPolling = function () {
  this.pollBalance();
  this.pollRate();
  this.executeTrades();

  this.balanceInterval = setInterval(this.pollBalance.bind(this), 60 * 1000);
  this.rateInterval = setInterval(this.pollRate.bind(this), 60 * 1000);

  // Always start trading, even if we don't have a trade exchange configured,
  // since configuration can always change in `Trader#configure`.
  // `Trader#executeTrades` returns early if we don't have a trade exchange
  // configured at the moment.
  this.tradeInterval = setInterval(
    this.executeTrades.bind(this),
    this.config.exchanges.settings.tradeInterval
  );
};

Trader.prototype.stopPolling = function () {
  clearInterval(this.balanceInterval);
  clearInterval(this.rateInterval);
};

Trader.prototype.pollBalance = function (callback) {
  var self = this;

  self.logger.info('collecting balance');

  async.parallel({
    transferBalance: self.transferExchange.balance.bind(self.transferExchange),
    tradeBalance: function (next) {
      if (!self.tradeExchange) {
        return next(null, null);
      }

      self.tradeExchange.balance(next);
    }
  }, function (err, balance) {
    if (err) {
      return callback && callback(err);
    }

    balance.timestamp = Date.now();
    self.logger.info('Balance update:', balance);
    self.balance = balance;

    return callback && callback(null, balance);
  });
};

Trader.prototype.pollRate = function (callback) {
  var self = this;

  var currency = self.config.exchanges.settings.currency;
  self.logger.info('polling for rate...');
  self.tickerExchange.ticker(currency, function(err, rate) {
    if (err) {
      return callback && callback(err);
    }

    self.logger.info('Rate update:', rate);
    self.rates[currency] = {rate: rate, timestamp: new Date()};
    return callback && callback(null, self.rates[currency]);
  });
};

Trader.prototype.rate = function () {
  return this.rates[this.config.exchanges.settings.currency];
};
