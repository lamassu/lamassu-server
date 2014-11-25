/* @flow weak */
'use strict';

var _ = require('lodash');
var async   = require('async');
var logger  = require('./logger');

var SATOSHI_FACTOR = 1e8;
var POLLING_RATE = 60 * 1000; // poll each minute
var REAP_RATE = 5 * 1000;
var PENDING_TIMEOUT = 70 * 1000;

// TODO: might have to update this if user is allowed to extend monitoring time
var DEPOSIT_TIMEOUT = 120 * 1000;

var db = null;

var tickerPlugin = null;
var traderPlugin = null;
var walletPlugin = null;
var idVerifierPlugin = null;
var infoPlugin = null;

var currentlyUsedPlugins = {};

var cachedConfig = null;
var deviceCurrency = 'USD';

var lastBalances = null;
var lastRates = {};

var balanceInterval = null;
var rateInterval = null;
var tradeInterval = null;
var reapTxInterval = null;

var tradesQueue = [];

// that's basically a constructor
exports.init = function init(databaseHandle) {
  if (!databaseHandle) {
    throw new Error('\'db\' is required');
  }

  db = databaseHandle;
};

function loadPlugin(name, config) {

  // plugins definitions
  var moduleMethods = {
    ticker: ['ticker'],
    trader: ['balance', 'purchase', 'sell'],
    wallet: ['balance', 'sendBitcoins', 'newAddress'],
    idVerifier: ['verifyUser', 'verifyTransaction'],
    info: ['getAddressLastTx', 'getTx']
  };

  var plugin = null;

  // each used plugin MUST be installed
  try {
    plugin = require('lamassu-' + name);
  } catch (_) {
    throw new Error(name + ' module is not installed. ' +
      'Try running \'npm install --save lamassu-' + name + '\' first');
  }

  // each plugin MUST implement those
  if (typeof plugin.SUPPORTED_MODULES !== 'undefined') {
    if (plugin.SUPPORTED_MODULES === 'string')
      plugin.SUPPORTED_MODULES = [plugin.SUPPORTED_MODULES];
  }

  if (!(plugin.SUPPORTED_MODULES instanceof Array))
    throw new Error('\'' + name + '\' fails to implement *required* ' +
      '\'SUPPORTED_MODULES\' constant');

  plugin.SUPPORTED_MODULES.forEach(function(moduleName) {
    moduleMethods[moduleName].forEach(function(methodName) {
      if (typeof plugin[methodName] !== 'function') {
        throw new Error('\'' + name + '\' declares \'' + moduleName +
          '\', but fails to implement \'' + methodName + '\' method');
      }
    });
  });

  // each plugin SHOULD implement those
  if (typeof plugin.NAME === 'undefined')
    logger.warn(new Error('\'' + name +
      '\' fails to implement *recommended* \'NAME\' field'));

  if (typeof plugin.config !== 'function') {
    logger.warn(new Error('\'' + name +
      '\' fails to implement *recommended* \'config\' method'));
    plugin.config = function() {};
  } else if (config !== null) {
    plugin.config(config); // only when plugin supports it, and config is passed
  }

  return plugin;
}

function loadOrConfigPlugin(pluginHandle, pluginType, currency,
    onChangeCallback) {
  var currentName = cachedConfig.exchanges.plugins.current[pluginType];
  var pluginChanged = currentlyUsedPlugins[pluginType] !== currentName;

  if (!currentName) pluginHandle = null;
  else { // some plugins may be disabled
    var pluginConfig = cachedConfig.exchanges.plugins.settings[currentName] ||
      {};

    if (currency) pluginConfig.currency = currency;

    if (pluginHandle && !pluginChanged) pluginHandle.config(pluginConfig);
    else {
      pluginHandle = loadPlugin(currentName, pluginConfig);
      logger.debug('plugin(%s) loaded: %s', pluginType, pluginHandle.NAME ||
        currentName);
    }
  }

  if (typeof onChangeCallback === 'function')
    onChangeCallback(pluginHandle, currency);

  return pluginHandle;
}

exports.configure = function configure(config) {
  if (config.exchanges.settings.lowBalanceMargin < 1) {
    throw new Error('\'settings.lowBalanceMargin\' has to be >= 1');
  }

  cachedConfig = config;
  deviceCurrency = config.exchanges.settings.currency;

  // TICKER [required] configure (or load)
  loadOrConfigPlugin(
    tickerPlugin,
    'ticker',
    deviceCurrency, // device currency
    function onTickerChange(newTicker) {
      tickerPlugin = newTicker;
      pollRate();
    }
  );

  // WALLET [required] configure (or load)
  loadOrConfigPlugin(
    walletPlugin,
    'transfer',
    null,
    function onWalletChange(newWallet) {
      walletPlugin = newWallet;
      pollBalance();
    }
  );

  // TRADER [optional] configure (or load)
  traderPlugin = loadOrConfigPlugin(
    traderPlugin,
    'trade',
    null,
    function onTraderChange(newTrader) {
      traderPlugin = newTrader;
      if (newTrader === null) stopTrader();
      else startTrader();
    }
  );

  // ID VERIFIER [optional] configure (or load)
  idVerifierPlugin = loadOrConfigPlugin(
    idVerifierPlugin,
    'idVerifier'
  );

  infoPlugin = loadOrConfigPlugin(
    infoPlugin,
    'info'
  );
};
exports.getCachedConfig = function getCachedConfig() {
  return cachedConfig;
};

exports.logEvent = function event(session, rawEvent) {
  db.recordDeviceEvent(session, rawEvent);
};

function _sendBitcoins(toAddress, satoshis, cb) {
  var transactionFee = cachedConfig.exchanges.settings.transactionFee;
  walletPlugin.sendBitcoins(toAddress, satoshis, transactionFee, cb);
}

function executeTx(session, tx, authority, cb) {
  db.addOutgoingTx(session, tx, function(err, satoshisToSend) {
    if (err) return cb(err);

    if (satoshisToSend === 0)
      return cb(null, {statusCode: 204, txId: tx.txId, txHash: null});

    _sendBitcoins(tx.toAddress, satoshisToSend, function(_err, txHash) {
      var fee = null; // Need to fill this out in plugins
      db.sentCoins(session, tx, authority, satoshisToSend, fee, _err, txHash);

      if (_err) return cb(err);

      pollBalance();
      cb(null, {
        statusCode: 201, // Created
        txHash: txHash,
        txId: tx.txId
      });
    });
  });
}

function reapOutgoingTx(session, tx) {
  executeTx(session, tx, 'timeout', function(err) {
    if (err) logger.error(err);
  });
}

function reapIncomingTx(session, tx) {
  infoPlugin.checkAddress(tx.toAddress, function(err, status,
      satoshisReceived) {
    if (status === 'notSeen') return;
    db.addIncomingTx(session, tx, status, satoshisReceived, function(err) {
      if (err) logger.error(err);
    });
  });
}

function reapTx(row) {
  var session = {fingerprint: row.device_fingerprint, id: row.session_id};
  var tx = {
    toAddress: row.to_address,
    currencyCode: row.currency_code,
    incoming: row.incoming
  };
  if (row.incoming) reapIncomingTx(session, tx);
  else reapOutgoingTx(session, tx);
}

function reapTxs() {
  db.removeOldPending(DEPOSIT_TIMEOUT);

  // NOTE: No harm in processing old pending tx, we don't need to wait for
  // removeOldPending to complete.
  db.pendingTxs(PENDING_TIMEOUT, function(err, results) {
    if (err) return logger.warn(err);
    var rows = results.rows;
    var rowCount = rows.length;
    for (var i = 0; i < rowCount; i++) {
      var row = rows[i];
      reapTx(row);
    }
  });
}

// TODO: Run these in parallel and return success
exports.trade = function trade(session, rawTrade, cb) {

  // TODO: move this to DB, too
  // add bill to trader queue (if trader is enabled)
  if (traderPlugin) {
    tradesQueue.push({
      currency: rawTrade.currency,
      satoshis: rawTrade.satoshis
    });
  }

  var tx = {
    txId: rawTrade.txId,
    fiat: 0,
    satoshis: 0,
    toAddress: rawTrade.toAddress,
    currencyCode: rawTrade.currency
  };

  async.parallel([
    async.apply(db.addPendingTx, session, tx),
    async.apply(db.recordBill, session, rawTrade)
  ], cb);
};

exports.sendBitcoins = function sendBitcoins(session, rawTx, cb) {
  executeTx(session, rawTx, 'machine', cb);
};

exports.cashOut = function cashOut(session, tx, cb) {
  var tmpInfo = {
    label: 'TX ' + Date.now(),
    account: 'deposit'
  };
  walletPlugin.newAddress(tmpInfo, function(err, address) {
    if (err) return cb(err);

    var newTx = _.clone(tx);
    newTx.toAddress = address;
    db.addInitialIncoming(session, newTx, function(_err) {
      cb(_err, address);
    });
  });
};

exports.dispenseStatus = function dispenseStatus(session, cb) {
  console.log('DEBUG1');
  db.dispenseStatus(session, cb);
};

exports.dispenseAck = function dispenseAck(session, tx) {
  db.addDispense(session, tx);
};

exports.fiatBalance = function fiatBalance() {
  var rawRate = exports.getDeviceRate().rates.ask;
  var commission = cachedConfig.exchanges.settings.commission;

  if (!rawRate || !lastBalances) return null;

  // The rate is actually our commission times real rate.
  var rate = commission * rawRate;

  // `lowBalanceMargin` is our safety net. It's a number > 1, and we divide
  // all our balances by it to provide a safety margin.
  var lowBalanceMargin = cachedConfig.exchanges.settings.lowBalanceMargin;

  // `balance.transferBalance` is the balance of our transfer account (the one
  // we use to send Bitcoins to clients) in satoshis.
  var transferBalance = lastBalances.transferBalance.BTC;

  // Since `transferBalance` is in satoshis, we need to turn it into
  // bitcoins and then fiat to learn how much fiat currency we can exchange.
  //
  // Unit validity proof: [ $ ] = [ (B * 10^8) / 10^8 * $/B ]
  //                      [ $ ] = [ B * $/B ]
  //                      [ $ ] = [ $ ]
  var fiatTransferBalance = ((transferBalance / SATOSHI_FACTOR) * rate) /
    lowBalanceMargin;

  return fiatTransferBalance;
};

/*
 * Polling livecycle
 */
exports.startPolling = function startPolling() {
  executeTrades();

  if (!balanceInterval)
    balanceInterval = setInterval(pollBalance, POLLING_RATE);

  if (!rateInterval)
    rateInterval = setInterval(pollRate, POLLING_RATE);

  if (!reapTxInterval)
    reapTxInterval = setInterval(reapTxs, REAP_RATE);

  startTrader();
};

function startTrader() {
  // Always start trading, even if we don't have a trade exchange configured,
  // since configuration can always change in `Trader#configure`.
  // `Trader#executeTrades` returns early if we don't have a trade exchange
  // configured at the moment.
  if (traderPlugin && !tradeInterval) {
    tradeInterval = setInterval(
      executeTrades,
      cachedConfig.exchanges.settings.tradeInterval
    );
  }
}
function stopTrader() {
  if (tradeInterval) {
    clearInterval(tradeInterval);
    tradeInterval = null;
    tradesQueue = [];
  }
}

function pollBalance(cb) {
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
      return cb && cb(err);
    }

    logger.debug('Balance update:', balance);
    balance.timestamp = Date.now();
    lastBalances = balance;

    return cb && cb(null, lastBalances);
  });
}

function pollRate(cb) {
  logger.debug('polling for rates (%s)', tickerPlugin.NAME);

  tickerPlugin.ticker(deviceCurrency, function(err, resRates) {
    if (err) {
      logger.error(err);
      return cb && cb(err);
    }

    logger.debug('got rates: %j', resRates);
    resRates.timestamp = new Date();
    lastRates = resRates;

    return cb && cb(null, lastRates);
  });
}

/*
 * Getters | Helpers
 */
function getLastRate(currency) {
  if (!lastRates) return null;

  var tmpCurrency = currency || deviceCurrency;
  if (!lastRates[tmpCurrency]) return null;

  return lastRates[tmpCurrency];
}
exports.getDeviceRate = function getDeviceRate() {
  return getLastRate(deviceCurrency);
};

exports.getBalance = function getBalance() {
  if (!lastBalances) return null;

  return lastBalances.transferBalance;
};

/*
 * Trader functions
 */
function purchase(trade, cb) {
  traderPlugin.purchase(trade.satoshis, null, function(err) {
    if (err) return cb(err);
    pollBalance();
    if (typeof cb === 'function') cb();
  });
}

function consolidateTrades() {
  // NOTE: value in satoshis stays the same no matter the currency
  var consolidatedTrade = {
    currency: deviceCurrency,
    satoshis: tradesQueue.reduce(function(prev, current) {
      return prev + current.satoshis;
    }, 0)
  };

  tradesQueue = [];

  logger.debug('consolidated: ', JSON.stringify(consolidatedTrade));
  return consolidatedTrade;
}

function executeTrades() {
  if (!traderPlugin) return;

  logger.debug('checking for trades');

  var trade = consolidateTrades();

  if (trade.satoshis === 0) {
    logger.debug('rejecting 0 trade');
    return;
  }

  logger.debug('making a trade: %d', trade.satoshis / SATOSHI_FACTOR);
  purchase(trade, function(err) {
    if (err) {
      tradesQueue.push(trade);
      logger.error(err);
    }
  });
}

/*
 * ID Verifier functions
 */
exports.verifyUser = function verifyUser(data, cb) {
  idVerifierPlugin.verifyUser(data, cb);
};

exports.verifyTx = function verifyTx(data, cb) {
  idVerifierPlugin.verifyTransaction(data, cb);
};
