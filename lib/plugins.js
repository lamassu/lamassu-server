'use strict';

var async   = require('async');

var logger  = require('./logger');


var SATOSHI_FACTOR = 1e8;
var SESSION_TIMEOUT = 60 * 60 * 1000;
var POLLING_RATE = 60 * 1000; // poll each minute

var db = null;

var tickerPlugin = null;
var traderPlugin = null;
var walletPlugin = null;
var idVerifierPlugin = null;

var cachedConfig = null;
var deviceCurrency = 'USD'; // Can 'USD' be set as default?

var lastBalances = null;
var lastRates = {};

var balanceInterval = null;
var rateInterval = null;
var tradeInterval = null;

var tradesQueue = [];
var sessions = {};


// that's basically a constructor
exports.init = function init(databaseHandle) {
  if (!databaseHandle) {
    throw new Error('`db` is required');
  }

  db = databaseHandle;
}


function loadPlugin(name, config) {

  // plugins definitions
  var moduleMethods = {
    ticker: [ 'ticker' ],
    trader: [ 'balance', 'purchase', 'sell' ],
    wallet: [ 'balance', 'sendBitcoins' ],
    idVerifier: [ 'verifyUser', 'verifyTransaction' ]
  };

  var plugin = null;

  // each used plugin MUST be installed
  try {
    plugin = require('lamassu-' + name);

  } catch(_) {
    throw new Error(name + ' module is not installed. Try running \'npm install --save lamassu-' + name + '\' first');
  }


  // each plugin MUST implement those
  if (typeof plugin.SUPPORTED_MODULES !== 'undefined') {
    if(plugin.SUPPORTED_MODULES === 'string')
      plugin.SUPPORTED_MODULES = [plugin.SUPPORTED_MODULES];

    if(!(plugin.SUPPORTED_MODULES instanceof Array))
      throw new Error('\'' + name + '\' fails to implement *required* \'SUPPORTED_MODULES\' constant');
  }

  plugin.SUPPORTED_MODULES.forEach(function(moduleName) {
    moduleMethods[moduleName].forEach(function(methodName) {
      if (typeof plugin[methodName] !== 'function') {
        throw new Error('\'' + name + '\' declares \'' + moduleName + '\', but fails to implement \'' + methodName + '\' method');
      }
    });
  });


  // each plugin SHOULD implement those
  if (typeof plugin.NAME === 'undefined')
    logger.warn(new Error('\'' + name + '\' fails to implement *recommended* \'NAME\' field'));

  if (typeof plugin.config !== 'function') {
    logger.warn(new Error('\'' + name + '\' fails to implement *recommended* \'config\' method'));
    plugin.config = function() {};
  } else if (config !== null)
    plugin.config(config); // only when plugin supports it, and config is passed


  return plugin;
};


exports.configure = function configure(config) {
  if (config.exchanges.settings.lowBalanceMargin < 1) {
    throw new Error('`settings.lowBalanceMargin` has to be >= 1');
  }

  deviceCurrency = config.exchanges.settings.currency;
  var plugins = config.exchanges.plugins

  // [required] configure (or load) ticker
  var tickerName = plugins.current.ticker;
  var tickerConfig = plugins.settings[tickerName] || {};
  tickerConfig.currency = deviceCurrency;

  if (tickerPlugin) tickerPlugin.config(tickerConfig);
  else tickerPlugin = loadPlugin(tickerName, tickerConfig);


  // [required] configure (or load) wallet
  var walletName = plugins.current.transfer;
  var walletConfig = plugins.settings[walletName];

  if (walletPlugin) walletPlugin.config(walletConfig);
  else walletPlugin = loadPlugin(walletName, walletConfig);


  // [optional] configure (or load) trader
  var traderName = plugins.current.trade;
  if (traderName) { // traderPlugin may be disabled
    var traderConfig = plugins.settings[traderName];

    if (traderPlugin) traderPlugin.config(traderConfig);
    else traderPlugin = loadPlugin(traderName, traderConfig);
  }


  // [optional] ID Verifier
  var verifierName = plugins.current.idVerifier;
  if (verifierName) { // idVerifierPlugin may be disabled
    var verifierConfig = plugins.settings[verifierName];

    if (idVerifierPlugin) idVerifierPlugin.config(verifierConfig);
    else loadPlugin(verifierName, verifierConfig);
  }


  cachedConfig = config;

  pollBalance();
  pollRate();
};


// This is where we record starting trade balance at the beginning
// of the user session
exports.trade = function trade(rawTrade, deviceFingerprint) {
  var sessionInfo = sessions[deviceFingerprint];

  if (!sessionInfo) {
    sessions[deviceFingerprint] = {
      timestamp: Date.now(),
      reaper: setTimeout(function() {
        delete sessions[deviceFingerprint];
      }, SESSION_TIMEOUT)
    };
  }

  tradesQueue.push({
    currency: rawTrade.currency,
    satoshis: rawTrade.satoshis
  });
};

exports.fiatBalance = function fiatBalance(deviceFingerprint) {
  var rawRate = getDeviceRate().rates.ask;
  var commision = cachedConfig.exchanges.settings.commision;

  if (!rawRate || !lastBalances) return null;

  // The rate is actually our commission times real rate.
  var rate = commission * rawRate;

  // `lowBalanceMargin` is our safety net. It's a number > 1, and we divide
  // all our balances by it to provide a safety margin.
  var lowBalanceMargin = cachedConfig.exchanges.settings.lowBalanceMargin;

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

  return fiatTransferBalance;
};

exports.sendBitcoins = function sendBitcoins(deviceFingerprint, tx, callback) {
  db.summonTransaction(deviceFingerprint, tx, function(err, txInfo) {
    if (err) return callback(err);

    if (!txInfo) {
      clearSession(deviceFingerprint);

      return walletPlugin.sendBitcoins(
        tx.toAddress,
        tx.satoshis,
        cachedConfig.exchanges.settings.transactionFee,

        function(err, txHash) {
          if (err) {
            var status = err.name === 'InsufficientFunds' ?
              'insufficientFunds' :
              'failed';

            db.reportTransactionError(tx, err.message, status);
            return callback(err);
          }

          db.completeTransaction(tx, txHash);
          pollBalance();
          callback(null, txHash);
        }
      );
    }

    // Out of bitcoins: special case
    var txErr = null;
    if (txInfo.err) {
      txErr = new Error(txInfo.err);
      if (txInfo.status === 'insufficientFunds') {
        txErr.name = 'InsufficientFunds';
      }
    }

    // transaction exists, but txHash might be null,
    // in which case ATM should continue polling
    pollBalance();
    callback(txErr, txInfo.txHash);
  });
};


/*
 * Polling livecycle
 */
exports.startPolling = function startPolling() {
  executeTrades();

  if (!balanceInterval) {
    balanceInterval = setInterval(pollBalance, POLLING_RATE);
  }

  if (!rateInterval) {
    rateInterval = setInterval(pollRate, POLLING_RATE);
  }

  // Always start trading, even if we don't have a trade exchange configured,
  // since configuration can always change in `Trader#configure`.
  // `Trader#executeTrades` returns early if we don't have a trade exchange
  // configured at the moment.
  if (!tradeInterval) {
    tradeInterval = setInterval(
      executeTrades,
      cachedConfig.exchanges.settings.tradeInterval
    );
  }
};
function stopPolling() {
  clearInterval(balanceInterval);
  clearInterval(rateInterval);
  // clearInterval(tradeInterval); // TODO: should this get cleared too?
};


function pollBalance(callback) {
  logger.debug('collecting balance');

  var jobs = {
    transferBalance: walletPlugin.balance
  };

  // only add if trader is enabled
  // if (traderPlugin) {
  //   // NOTE: we would need to handle when traderCurrency!=deviceCurrency
  //   jobs.tradeBalance = traderPlugin.balance;
  // }

  async.parallel(jobs, function(err, balance) {
    if (err) {
      logger.error(err);
      return callback && callback(err);
    }

    logger.debug('Balance update:', balance);
    balance.timestamp = Date.now();
    lastBalances = balance;

    return callback && callback(null, lastBalances);
  });
};

function pollRate(callback) {
  logger.debug('polling for rates');

  tickerPlugin.ticker(deviceCurrency, function(err, resRates) {
    if (err) {
      logger.error(err);
      return callback && callback(err);
    }

    logger.debug('got rates: %j', resRates);
    resRates.timestamp = new Date();
    lastRates = resRates;

    return callback && callback(null, lastRates);
  });
};


/*
 * Getters | Helpers
 */
function getLastRate(currency) {
  if (!lastRates) return null;

  var tmpCurrency = currency || deviceCurrency;
  if (!lastRates[tmpCurrency]) return null;

  return lastRates[tmpCurrency];
};
function getDeviceRate() {
  return getLastRate(deviceCurrency);
};

function getBalance() {
  if (!lastBalances) return null;

  return lastBalances.transferBalance;
};

function clearSession(deviceFingerprint) {
  var session = sessions[deviceFingerprint];
  if (session) {
    clearTimeout(session.reaper);
    delete sessions[deviceFingerprint];
  }
};


/*
 * Trader functions
 */
function purchase(trade, callback) {
  traderPlugin.purchase(trade.satoshis, null, function(err, _) {
    if (err) return callback(err);
    pollBalance();
    callback && callback();
  });
};

function consolidateTrades() {
  // NOTE: value in satoshis stays the same no matter the currency
  var consolidatedTrade = {
    currency: deviceCurrency,
    satoshis: tradesQueue.reduce(function(prev, current) {
      return prev + current.satoshis;
    }, 0)
  };

  logger.debug('consolidated: ', JSON.stringify(consolidatedTrade));
  return consolidatedTrade;
};

function executeTrades() {
  if (!traderPlugin) return;

  logger.debug('checking for trades');

  var trade = consolidateTrades();

  if (trade.satoshis === 0) {
    logger.debug('rejecting 0 trade');
    return;
  }

  logger.trade.debug('making a trade: %d', trade.satoshis / SATOSHI_FACTOR);
  purchase(trade, function(err) {
    if (err) logger.error(err);
  });
};

/*
 * ID Verifier functions
 */
exports.verifyUser = function verifyUser(rawData, callback) {
  idVerifierPlugin.verifyUser(rawData, callback);
};

exports.verifyTransaction = function verifyTransaction(rawData, callback) {
  idVerifier.verifyTransaction(rawData, callback);
};
