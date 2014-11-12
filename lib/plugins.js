'use strict';

var async   = require('async');

var logger  = require('./logger');


var SATOSHI_FACTOR = 1e8;
var SESSION_TIMEOUT = 60 * 60 * 1000;
var POLLING_RATE = 60 * 1000; // poll each minute

var RECOMMENDED_FEE = 10000;
var TX_0CONF_WAIT_TIME = 20 * 1000; // wait 20 seconds
var MIN_CONFIDENCE = 0.7;

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
    wallet: [ 'balance', 'sendBitcoins', 'newAddress' ],
    idVerifier: [ 'verifyUser', 'verifyTransaction' ],
    info: [ 'getAddressLastTx', 'getTx' ]
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
    else {
      pluginHandle = loadPlugin(currentName, pluginConfig);
      logger.debug('plugin(%s) loaded: %s', pluginType, pluginHandle.NAME || currentName);
    }
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

  infoPlugin = loadOrConfigPlugin(
    infoPlugin,
    'info'
  );
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


// sets given status both "locally" (dispenseStatuses) and saves to db
function _setDispenseStatus(deviceFingerprint, tx, status, deposit) {
  tx.status = status;

  // No need to set default state again
  if (status !== 'noDeposit')
    // save to db ASAP
    db.changeTxStatus(tx.txId, status, {
      hash: tx.txHash
    });

  var fiat = 0;
  if (status === 'authorizedDeposit' || status === 'confirmedDeposit')
    fiat = tx.fiat;

  var statusObject = null;
  if (status !== 'dispensedDeposit')
    statusObject = {
      status: status,
      txId: tx.txId,
      deposit: deposit || 0,
      dispenseFiat: fiat,
      expectedDeposit: tx.satoshis
    };

  // keep local copy
  dispenseStatuses[deviceFingerprint] = statusObject;
}

function _checkTx(deviceFingerprint, tx, txInfo) {
  // accept if tx is already confirmed
  if (txInfo.confirmations > 0) {
    _setDispenseStatus(deviceFingerprint, tx, 'confirmedDeposit', txInfo.amount);
    return true;
  }

  // NOTE: we can put some heuristics here

  // consider authorization raported by the 'info' plugin
  if (txInfo.authorized === true && txInfo.confidence >= MIN_CONFIDENCE) {
    _setDispenseStatus(deviceFingerprint, tx, 'authorizedDeposit', txInfo.amount);
    return true;
  }

  // SHOULD TAKE MUCH MORE FACTORS INTO ACCOUNT HERE
  // accept txs with recommended fee and with at least 20s of propagation time
  if (txInfo.fees >= RECOMMENDED_FEE && txInfo.tsReceived + TX_0CONF_WAIT_TIME < Date.now()) {
    _setDispenseStatus(deviceFingerprint, tx, 'authorizedDeposit', txInfo.amount);
    return true;
  }

  return false;
}

// this is invoked only when tx is fresh enough AND is for a right amount
function _monitorTx(deviceFingerprint, tx) {
  infoPlugin.getTx(tx.txHash, tx.toAddress, function(err, txInfo) {
    if (err) {
      logger.error(err);
      return setTimeout(_monitorTx, 300, [deviceFingerprint, tx]);
    }

    if (_checkTx(deviceFingerprint, tx, txInfo))
      return;

    setTimeout(_monitorTx, 300, [deviceFingerprint, tx]);
  });
}

function _monitorAddress(deviceFingerprint, tx) {
  infoPlugin.getAddressLastTx(tx.toAddress, function(err, txInfo) {
    if (err) {
      logger.error(err);
      return setTimeout(_monitorAddress, 300, [deviceFingerprint, tx]);
    }

    // no tx occured at all or deposit address was reused; some previous tx was returned
    if (!txInfo || txInfo.tsReceived < tx.created) {
      return setTimeout(_monitorAddress, 300, [deviceFingerprint, tx]);
    }

    // when sent TX is not enough
    if (txInfo.amount < tx.satoshis)
      return _setDispenseStatus(deviceFingerprint, tx, 'insufficientDeposit', txInfo.amount);

    // store txHash for later reference
    tx.txHash = txInfo.txHash;

    // warn about dangerous TX
    if (txInfo.fees < RECOMMENDED_FEE)
      logger.warn('TXs w/o fee can take forever to confirm!');

    // make sure tx isn't already in an acceptable state
    if (_checkTx(deviceFingerprint, tx, txInfo))
      return;

    // update tx status and save first txHash
    _setDispenseStatus(deviceFingerprint, tx, 'fullDeposit', txInfo.amount);

    // start monitoring TX (instead of an address)
    setTimeout(_monitorTx, 300, [deviceFingerprint, tx]);
  });
}

exports.cashOut = function cashOut(deviceFingerprint, tx, cb) {
  var tmpInfo = {
    label: 'TX ' + Date.now(),
    account: 'deposit'
  };
  walletPlugin.newAddress(tmpInfo, function(err, address) {
    if (err)
      return cb(new Error(err));

    tx.toAddress = address;
    tx.tx_type = 'sell';

    db.insertTx(deviceFingerprint, tx, function(err) {
      if (err)
        return cb(new Error(err));

      _setDispenseStatus(deviceFingerprint, tx, 'noDeposit');

      // start watching address for incoming txs
      _monitorAddress(deviceFingerprint, tx);

      // return address to the machine
      return cb(null, address);
    });
  });
};

exports.depositAck = function depositAck(deviceFingerprint, tx) {
  _setDispenseStatus(deviceFingerprint, tx, 'dispensedDeposit');
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
