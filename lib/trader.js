'use strict';

var async = require('async');
var logger = require('./logger');

var SATOSHI_FACTOR = 1e8;

// TODO: Define this somewhere more global
var SESSION_TIMEOUT = 60 * 60 * 1000;   // an hour

var Trader = module.exports = function (db) {
  if (!db) {
    throw new Error('`db` is required');
  }

  this.db = db;
  this.rates = {};
  this._tradeQueue = [];
  this._sessionInfo = {};
  this.rateInfo = null;
};

Trader.prototype._findExchange = function (name) {
  return require('lamassu-' + name);
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

Trader.prototype._purchase = function (trade, cb) {
  var self = this;
  var tradeCurrency = this.tradeExchange.currency();
  var rate = this.rate(tradeCurrency).rate;
  this.tradeExchange.purchase(trade.satoshis, rate, function (err) {
    if (err) return cb(err);
    self.pollBalance();
    cb();
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

// IMPORTANT: This function returns the estimated minimum available balance
// in fiat as of the start of the current user session on the device. User 
// session starts when a user presses then Start button and ends when we
// send the bitcoins.
Trader.prototype.fiatBalance = function (deviceFingerprint) {
  var rawRate = this.rate(this.config.exchanges.settings.currency).rate;
  var balance = this.balance;
  var commission = this.config.exchanges.settings.commission;

  if (!rawRate || !balance) {
    return null;
  }

  // The rate is actually our commission times real rate.
  var rate = commission * rawRate;

  // `lowBalanceMargin` is our safety net. It's a number > 1, and we divide
  // all our balances by it to provide a safety margin.
  var lowBalanceMargin = this.config.exchanges.settings.lowBalanceMargin;

  // `balance.transferBalance` is the balance of our transfer account (the one
  // we use to send Bitcoins to clients) in satoshis.
  var transferBalance = balance.transferBalance;
  
  // Since `transferBalance` is in satoshis, we need to turn it into
  // bitcoins and then fiat to learn how much fiat currency we can exchange.
  //
  // Unit validity proof: [ $ ] = [ (B * 10^8) / 10^8 * $/B ]
  //                      [ $ ] = [ B * $/B ]
  //                      [ $ ] = [ $ ]
  var fiatTransferBalance = ((transferBalance / SATOSHI_FACTOR) * rate) / lowBalanceMargin;

  // If this server is also configured to trade received fiat for Bitcoins,
  // we also need to calculate if we have enough funds on our trade exchange.
  if (balance.tradeBalance === null) return fiatTransferBalance;
  var tradeBalance = balance.tradeBalance;

  // We're reporting balance as of the start of the user session.
  var sessionInfo = this._sessionInfo[deviceFingerprint];
  var sessionBalance = sessionInfo ? sessionInfo.tradeBalance : tradeBalance;
  var fiatTradeBalance = sessionBalance / lowBalanceMargin;

  // And we return the smallest number.
  return Math.min(fiatTransferBalance, fiatTradeBalance);
};

Trader.prototype._clearSession = function (deviceFingerprint) {
  var sessionInfo = this._sessionInfo[deviceFingerprint];
  if (sessionInfo) {
    clearTimeout(sessionInfo.reaper);
    delete this._sessionInfo[deviceFingerprint];
  }
};

Trader.prototype.sendBitcoins = function (deviceFingerprint, tx, cb) {
  var self = this;

  self.db.summonTransaction(deviceFingerprint, tx, function (err, txRec) {
    if (err) {
      return cb(err);
    }

    if (!txRec) {
      self._clearSession(deviceFingerprint);
      return self.transferExchange.sendBitcoins(
        tx.toAddress,
        tx.satoshis,
        self.config.exchanges.settings.transactionFee,
        function(err, txHash) {
          if (err) {
            var status = err.name === 'InsufficientFunds' ?
              'insufficientFunds' :
              'failed';
            self.db.reportTransactionError(tx, err.message, status);
            return cb(err);
          }

          self.db.completeTransaction(tx, txHash);
          self.pollBalance();
          cb(null, txHash);
        }
      );
    }

    // Out of bitcoins: special case
    var txErr = null;
    if (txRec.err) {
      txErr = new Error(txRec.err);
      if (txRec.status === 'insufficientFunds') txErr.name = 'InsufficientFunds';
    }

    // transaction exists, but txHash might be null, 
    // in which case ATM should continue polling
    self.pollBalance();
    cb(txErr, txRec.txHash);
  });
};

Trader.prototype.trade = function (rec, deviceFingerprint) {
  // This is where we record starting trade balance at the beginning
  // of the user session
  var sessionInfo = this._sessionInfo[deviceFingerprint];
  var self = this;
  if (!sessionInfo) {
    this._sessionInfo[deviceFingerprint] = {
      tradeBalance: this.balance.tradeBalance,
      timestamp: Date.now(),
      reaper: setTimeout(function () {
        delete self._sessionInfo[deviceFingerprint];
      }, SESSION_TIMEOUT)
    };
  } 
  this._tradeQueue.push({fiat: rec.fiat, satoshis: rec.satoshis, currency: rec.currency});
};

Trader.prototype.executeTrades = function () {
  if (!this.tradeExchange) return;

  logger.debug('checking for trades');

  var trade = this._consolidateTrades();
  logger.debug('consolidated: ', JSON.stringify(trade));

  if (trade.fiat === 0) {
    logger.debug('rejecting 0 trade');
    return;
  }

  if (trade.fiat < this.config.exchanges.settings.minimumTradeFiat) {
    // throw it back in the water
    logger.debug('reject fiat too small');
    this._tradeQueue.unshift(trade);
    return;
  }

  logger.debug('making a trade: %d', trade.satoshis / Math.pow(10, 8));
  this._purchase(trade, function (err) {
    if (err) logger.error(err);
  });
};

Trader.prototype.startPolling = function () {
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

// Trade exchange could be in a different currency than Bitcoin Machine.
// For instance, trade exchange could be Bitstamp, denominated in USD,
// while Bitcoin Machine is set to ILS.
//
// We need this function to convert the trade exchange balance into the
// Bitcoin Machine denomination, in the example case: ILS.
//
// The best way to do that with available data is to take the ratio between
// the exchange rates for the Bitcoin Machine and the trade exchange.
Trader.prototype._tradeForexMultiplier = function _tradeForexMultiplier() {
  var deviceCurrency = this.config.exchanges.settings.currency;
  var tradeCurrency = this.tradeExchange.currency();
  var deviceRate = this._deviceRate();
  var tradeRate = this._tradeRate();

  var forexMultiplier = deviceRate && tradeRate ?
    deviceRate / tradeRate :
    null;

  return deviceCurrency === tradeCurrency ?
    1 :
    forexMultiplier;
};

Trader.prototype._tradeBalanceFunc = function _tradeBalanceFunc(callback) {
  if (!this.tradeExchange) return callback(null, null);
  var forexMultiplier = this._tradeForexMultiplier();
  if (!forexMultiplier) return callback(new Error('Can\'t compute balance, no tickers yet.')); 
  this.tradeExchange.balance(function (err, localBalance) {
    if (err) return callback(err);
    callback(null, localBalance * forexMultiplier);
  });
};

Trader.prototype.pollBalance = function (callback) {
  var self = this;

  logger.debug('collecting balance');

  var transferBalanceFunc = this.transferExchange.balance.bind(this.transferExchange);
  var tradeBalanceFunc = this._tradeBalanceFunc.bind(this);

  async.parallel({
    transferBalance: transferBalanceFunc,
    tradeBalance: tradeBalanceFunc
  }, function (err, balance) {
    if (err) {
      return callback && callback(err);
    }

    balance.timestamp = Date.now();
    logger.debug('Balance update:', balance);
    self.balance = balance;

    return callback && callback();
  });
};

Trader.prototype.pollRate = function (callback) {
  var self = this;

  logger.debug('polling for rates...');
  var deviceCurrency = this.config.exchanges.settings.currency;
  var currencies = [deviceCurrency];
  if (this.tradeExchange) {
    var tradeCurrency = this.tradeExchange.currency();
    if (tradeCurrency !== deviceCurrency) currencies.push(tradeCurrency);
  }

  self.tickerExchange.ticker(currencies, function(err, resRates) {
    if (err) {
      logger.error(err);
      return callback && callback(err);
    }

    logger.debug('got rates: %j', resRates);
    self.rateInfo = {rates: resRates, timestamp: new Date()};
    callback && callback();
  });
};

Trader.prototype._deviceRate = function _deviceRate() {
  if (!this.rateInfo) return null;
  return this.rateInfo.rates[this.config.exchanges.settings.currency].rate;
};

Trader.prototype._tradeRate = function _tradeRate() {
  if (!this.tradeExchange || !this.rateInfo) return null;
  return this.rateInfo.rates[this.tradeExchange.currency()].rate;
};

// This is the rate in local currency to quote to the user
Trader.prototype.rate = function () {
  if (!this.rateInfo) return null;
  return {
    rate: this._deviceRate(),
    timestamp: this.rateInfo.timestamp
  };
};
