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

var blockchainUtil = null;

var currentlyUsedPlugins = {};


var cachedConfig = null;
var deviceCurrency = 'USD';

var lastBalances = null;
var lastRates = {};

var balanceInterval = null;
var rateInterval = null;
var tradeInterval = null;

var tradesQueue = [];
var sessions = {};
var dispenseStatuses = {};


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
  }

  if(!(plugin.SUPPORTED_MODULES instanceof Array))
    throw new Error('\'' + name + '\' fails to implement *required* \'SUPPORTED_MODULES\' constant');

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
}

function loadOrConfigPlugin(pluginHandle, pluginType, currency, onChangeCallback) {
  var currentName = cachedConfig.exchanges.plugins.current[pluginType];
  var pluginChanged = currentlyUsedPlugins[pluginType] !== currentName;

  if (!currentName) pluginHandle = null;
  else { // some plugins may be disabled
    var pluginConfig = cachedConfig.exchanges.plugins.settings[currentName] || {};

    if (currency) pluginConfig.currency = currency;

    if (pluginHandle && !pluginChanged) pluginHandle.config(pluginConfig);
    else pluginHandle = loadPlugin(currentName, pluginConfig);
  }

  if (typeof onChangeCallback === 'function') onChangeCallback(pluginHandle, currency);

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

  // NOTE: temp solution
  if (blockchainUtil === null)
    blockchainUtil = require('./blockchain_util');
};
exports.getCachedConfig = function getCachedConfig() {
  return cachedConfig;
};

exports.logEvent = function event(rawEvent, deviceFingerprint) {
  db.recordDeviceEvent(deviceFingerprint, rawEvent);
};


// Just prompts plugin to send BTC
function _sendBitcoins(tx, cb) {
  logger.debug('executing tx: %j', tx);
  db.changeTxStatus(tx.txId, 'executing');
  walletPlugin.sendBitcoins(
    tx.toAddress,
    tx.satoshis,
    cachedConfig.exchanges.settings.transactionFee,

    function(err, txHash) {
      if (err) {
        var status = err.name === 'InsufficientFunds' ?
          'insufficientFunds' :
          'failed';

        // report insufficient funds error
        db.changeTxStatus(tx.txId, status, {error: err.message});
        return cb(err);
      }

      if (txHash) db.changeTxStatus(tx.txId, 'completed', {hash: txHash});
      else db.changeTxStatus(tx.txId, 'failed', {error: 'No txHash received'});

      pollBalance();
      cb(null, txHash);
    }
  );
}

function executeTx(deviceFingerprint, txId, triggeredByUser, cb) {
  cb = typeof cb === 'function' ? cb : function() {};

  clearSession(deviceFingerprint);

  // 1. get remaining amount to be sent
  db.getPendingAmount(txId, function(err, tx) {
    if (err) {
      logger.error(err);
      return cb(err);
    }

    if (!tx) {
      logger.info('Nothing to send (%s)', txId);

      // all bills were already sent by a timeout trigger;
      // now only mark that user's `/send` arrived
      if (triggeredByUser)
        db.changeTxStatus(txId, 'completed', {is_completed: true});

      // indicate ACK to machine
      return cb(null, {
        statusCode: 204, // No Content
        txId: txId
      });
    }

    // indicate whether this call was initiated by user or timeout
    if (triggeredByUser)
      tx.is_completed = true;

    // 2. BEFORE sending insert tx to a db
    db.insertTx(deviceFingerprint, tx, function(err) {
      if (err) {
        // `getPendingAmount` generated new `partial_id`, so this can occur
        // only when 2nd executeTx gets called before 1st executes it's insert
        if (err.name === 'UniqueViolation') {
          // this will calculate again and then send only "pending" coins
          return executeTx(deviceFingerprint, txId, triggeredByUser, cb);
        }

        return cb(err);
      }

      // 3. actual sending (of the same amount, that was just inserted to the db)
      return _sendBitcoins(tx, function(err, txHash) {
        pollBalance();
        // TODO: should we indicate error to the machine here?

        // indicate ACK to machine
        cb(null, {
          statusCode: 201, // Created
          txId: txId
        });
      });
    });
  });
}

// This is where we record starting trade balance at the beginning
// of the user session
exports.trade = function trade(rawTrade, deviceFingerprint, cb) {
  if (!sessions[deviceFingerprint]) {
    sessions[deviceFingerprint] = {
      timestamp: Date.now(),
      reaper: setTimeout(function() {
        executeTx(deviceFingerprint, rawTrade.txId, false);
      }, SESSION_TIMEOUT)
    };
  }

  // add bill to trader queue (if trader is enabled)
  if (traderPlugin) {
    tradesQueue.push({
      currency: rawTrade.currency,
      satoshis: rawTrade.satoshis
    });
  }

  // record/log inserted bill
  db.recordBill(deviceFingerprint, rawTrade, cb);
};

exports.sendBitcoins = function sendBitcoins(deviceFingerprint, rawTx, cb) {
  executeTx(deviceFingerprint, rawTx.txId, true, cb);
};

function _monitorAddress(address, cb) {
  var confs = 0;
  var received = 0;
  var t0 = Date.now();
  var timeOut = 90000;  // TODO make config
  var interval = 300;   // TODO make config

  function checkAddress(_cb) {
    blockchainUtil.addressReceived(address, confs, function(err, _received) {
      if (err) logger.error(err);
      if (_received > 0) received = _received;
      setTimeout(_cb, interval);
    });
  }

  function test() {
    return received > 0 || Date.now() - t0 > timeOut;
  }

  function handler() {
    if (received === 0)
      return cb(new Error('Timeout while monitoring address'));

    cb(null, received);
  }

  async.doUntil(checkAddress, test, handler);
}

function _waitDeposit(deviceFingerprint, tx) {
  _monitorAddress(tx.toAddress, function(err, received) {
    var status = 'fullDeposit';

    if (err) status = 'timeout';
    else if (received < tx.satoshis) status = 'insufficientDeposit';

    var dispenseFiat = received >= tx.satoshis ? tx.fiat : 0;
    dispenseStatuses[deviceFingerprint] = {
      status: status,
      txId: tx.txId,
      deposit: received,
      dispenseFiat: dispenseFiat,
      expectedDeposit: tx.satoshis
    };

    // TODO db.dispenseReady(tx);
  });
}

exports.cashOut = function cashOut(deviceFingerprint, tx, cb) {
  var tmpInfo = {
    label: 'TX ' + Date.now(),
    account: 'deposit'
  };
  walletPlugin.newAddress('deposit', function(err, address) {
    if (err) return cb(new Error(err));

    tx.toAddress = address;
    // WARN: final db structure will determine if we can use this method
    db.insertTx(deviceFingerprint, tx, function(err) {
      if (err) return cb(new Error(err));

      _waitDeposit(deviceFingerprint, tx);
      return cb(null, address);
      // NOTE: logic here will depend on a way we want to handle those txs
    });

  });
};

exports.depositAck = function depositAck(deviceFingerprint, tx, cb) {
/* TODO
  var status = dispenseStatuses[deviceFingerprint];

  if (status === 'dispense') {
    db.dispensing(tx, function (err) {
      if (err) return cb(new Error(err));
      dispenseStatuses[deviceFingerprint] = null;
      return cb();
    });
  }
*/

  dispenseStatuses[deviceFingerprint] = null;
  cb();
};

exports.dispenseStatus = function dispenseStatus(deviceFingerprint) {
  return dispenseStatuses[deviceFingerprint];
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
  var fiatTransferBalance = ((transferBalance / SATOSHI_FACTOR) * rate) / lowBalanceMargin;

  return fiatTransferBalance;
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

function clearSession(deviceFingerprint) {
  var session = sessions[deviceFingerprint];
  if (session) {
    clearTimeout(session.reaper);
    delete sessions[deviceFingerprint];
  }
}


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
