/* @flow weak */
'use strict';

// TODO: Consider using serializable transactions for true ACID

var pg = require('pg');
var async = require('async');
var _ = require('lodash');

var logger = require('./logger');

var PG_ERRORS = {
  '23505': 'uniqueViolation'
};

var conString = null;

function rollback(client, done) {
  logger.warn('Rolling back transaction.');
  client.query('ROLLBACK', function(err) {
    return done(err);
  });
}

function getInsertQuery(tableName, fields, hasId) {

  // outputs string like: '$1, $2, $3...' with proper No of items
  var placeholders = fields.map(function(_, i) {
    return '$' + (i + 1);
  }).join(', ');

  var query = 'INSERT INTO ' + tableName +
    ' (' + fields.join(', ') + ')' +
    ' VALUES' +
    ' (' + placeholders + ')';

  if (hasId) query += ' RETURNING id';

  return query;
}

exports.init = function init(_conString) {
  conString = _conString;
  if (!conString) {
    throw new Error('Postgres connection string is required');
  }
};

function connect(cb) {
  pg.connect(conString, function(err, client, done) {
    if (err) logger.error(err);
    cb(err, client, done);
  });
}

// logs inputted bill and overall tx status (if available)
exports.recordBill = function recordBill(session, rec, cb) {
  var fields = [
    'device_fingerprint',
    'currency_code',
    'to_address',
    'session_id',
    'device_time',

    'satoshis',
    'denomination'
  ];

  var values = [
    session.fingerprint,
    rec.currency,
    rec.toAddress,
    session.id,
    rec.deviceTime,

    rec.satoshis,
    rec.fiat
  ];

  connect(function(err, client, done) {
    if (err) return cb(err);
    query(client, getInsertQuery('bills', fields), values, function(err) {
      done();
      // TODO: Handle unique violations more cleanly for idempotency
      // Now, it just returns an error, which should be fine, but a 204 status
      // would be nicer.
      cb(err);
    });
  });
};

exports.recordDeviceEvent = function recordDeviceEvent(session, event) {
  connect(function(err, client, done) {
    if (err) return;
    var sql = 'INSERT INTO device_events (device_fingerprint, event_type, ' +
      'note, device_time) VALUES ($1, $2, $3, $4)';
    var values = [session.fingerprint, event.eventType, event.note,
      event.deviceTime];
    client.query(sql, values, done);
  });
};

function query(client, queryStr, values, cb) {
  if (!cb) {
    cb = values;
    values = [];
  }

//  console.log(queryStr);
//  console.log(values);
//  console.trace(); // DEBUG

  client.query(queryStr, values, function(err, results) {
    if (err) return cb(new Error(err));
    cb(null, results);
  });
}

function silentQuery(client, queryStr, values, cb) {
  if (!cb) {
    cb = values;
    values = [];
  }

  client.query(queryStr, values, function(err) {
    if (err) cb(new Error(err));
    cb();
  });
}

// OPTIMIZE: No need to query bills if tx.fiat and tx.satoshis are set
function billsAndTxs(client, session, cb) {
  var sessionId = session.id;
  var fingerprint = session.fingerprint;
  var billsQuery = 'SELECT SUM(denomination) as fiat, ' +
    'SUM(satoshis) AS satoshis ' +
    'FROM bills ' +
    'WHERE device_fingerprint=$1 AND session_id=$2';
  var billsValues = [fingerprint, sessionId];
  var txQuery = 'SELECT SUM(fiat) AS fiat, SUM(satoshis) AS satoshis ' +
    'FROM transactions ' +
    'WHERE device_fingerprint=$1 AND session_id=$2 AND stage=$3';
  var txValues = [fingerprint, sessionId, 'partial_request'];

  async.parallel([
    async.apply(query, client, billsQuery, billsValues),
    async.apply(query, client, txQuery, txValues)
  ], function(err, results) {
    if (err) return cb(err);

    // Note: PG SUM function returns int8, which is returned as a string, so
    // we need to parse, since we know these won't be huge numbers.
    cb(null, {
      billsFiat: parseInt(results[0].rows[0].fiat),
      billsSatoshis: parseInt(results[0].rows[0].satoshis),
      txFiat: parseInt(results[1].rows[0].fiat),
      txSatoshis: parseInt(results[1].rows[0].satoshis)
    });
  });
}

function computeSendAmount(tx, totals) {
  var result = {
    fiat: (tx.fiat || totals.billsFiat) - totals.txFiat,
    satoshis: (tx.satoshis || totals.billsSatoshis) - totals.txSatoshis
  };
  if (result.fiat < 0 || result.satoshis < 0) {
    logger.warn({tx: tx, totals: totals, result: result},
      'computeSendAmount result < 0, this shouldn\'t happen. ' +
      'Maybe timeout arrived after machineSend.');
    result.fiat = 0;
    result.satoshis = 0;
  }
  return result;
}

exports.removeOldPending = function removeOldPending(timeoutMS) {
  connect(function(err, client, done) {
    var sql = 'DELETE FROM pending_transactions ' +
      'WHERE incoming AND extract(EPOCH FROM now() - created) > $1';
    var timeoutS = timeoutMS / 1000;
    var values = [timeoutS];
    query(client, sql, values, function(err) {
      done();
      if (err) logger.error(err);
    });
  });
};

exports.pendingTxs = function pendingTxs(timeoutMS, cb) {
  connect(function(err, client, done) {
    var sql = 'SELECT * ' +
      'FROM pending_transactions ' +
      'WHERE (incoming OR extract(EPOCH FROM now() - created) > $1) ' +
      'ORDER BY created ASC';
    var timeoutS = timeoutMS / 1000;
    var values = [timeoutS];
    query(client, sql, values, function(err, results) {
      done();
      cb(err, results);
    });
  });
};

function removePendingTx(client, session, cb) {
  var sql = 'DELETE FROM pending_transactions ' +
    'WHERE device_fingerprint=$1 AND session_id=$2';
  silentQuery(client, sql, [session.fingerprint, session.id], cb);
}

function insertOutgoingTx(client, session, tx, totals, cb) {
  var sendAmount = computeSendAmount(tx, totals);
  var stage = 'partial_request';
  var authority = tx.fiat ? 'machine' : 'timeout';
  var satoshis = sendAmount.satoshis;
  var fiat = sendAmount.fiat;
  insertOutgoing(client, session, tx, satoshis, fiat, stage, authority,
      function(err) {

    if (err) return cb(err);
    cb(null, satoshis);
  });
}

function insertOutgoingCompleteTx(client, session, tx, cb) {

  // Only relevant for machine source transactions, not timeouts
  if (!tx.fiat) return cb();

  var stage = 'final_request';
  var authority = 'machine';
  var satoshis = tx.satoshis;
  var fiat = tx.fiat;
  insertOutgoing(client, session, tx, satoshis, fiat, stage, authority, cb);
}

function insertIncoming(client, session, tx, satoshis, fiat, stage, authority,
    cb) {
  insertTx(client, session, true, tx, satoshis, fiat, stage, authority, cb);
}

function insertOutgoing(client, session, tx, satoshis, fiat, stage, authority,
    cb) {
  insertTx(client, session, false, tx, satoshis, fiat, stage, authority, cb);
}

function insertTx(client, session, incoming, tx, satoshis, fiat, stage,
    authority, cb) {
  var fields = [
    'session_id',
    'stage',
    'authority',
    'incoming',
    'device_fingerprint',
    'to_address',
    'satoshis',
    'currency_code',
    'fiat',
    'tx_hash',
    'error'
  ];

  var values = [
    session.id,
    stage,
    authority,
    incoming,
    session.fingerprint,
    tx.toAddress,
    satoshis,
    tx.currencyCode,
    fiat,
    tx.txHash,
    tx.error
  ];

  query(client, getInsertQuery('transactions', fields, true), values,
      function(err, results) {
    if (err) return cb(err);
    cb(null, results.rows[0].id);
  });
}

function addPendingTx(client, session, incoming, currencyCode, toAddress, cb) {
  console.log('DEBUG5: %s', incoming);
  connect(function(err, client, done) {
    if (err) return cb(err);
    var fields = ['device_fingerprint', 'session_id', 'incoming',
      'currency_code', 'to_address'];
    var sql = getInsertQuery('pending_transactions', fields);
    var values = [session.fingerprint, session.id, incoming, currencyCode,
      toAddress];
    query(client, sql, values, function(_err) {
      done();

      // If pending tx already exists, do nothing
      if (_err && PG_ERRORS[_err.code] !== 'uniqueViolation')
        logger.error(err);

      cb(_err);
    });
  });
}

// Calling function should only send bitcoins if result.satoshisToSend > 0
exports.addOutgoingTx = function addOutgoingTx(session, tx, cb) {
  connect(function(err, client, done) {
    if (err) return cb(err);
    async.waterfall([
      async.apply(silentQuery, client, 'BEGIN', null),
      async.apply(insertOutgoingCompleteTx, client, session, tx),
      async.apply(removePendingTx, client, tx.sessionId),
      async.apply(billsAndTxs, client, session, tx.currencyCode),
      async.apply(insertOutgoingTx, client, session, tx),
    ], function(err, satoshisToSend) {
      if (err) {
        rollback(client, done);
        return cb(err);
      }
      silentQuery(client, 'COMMIT', null, function() {
        done();
        cb(null, satoshisToSend);
      });
    });
  });
};

exports.sentCoins = function sentCoins(session, tx, authority, satoshis, fee,
  error, txHash) {
  connect(function(err, client, done) {
    if (err) return logger.error(err);

    var newTx = _.clone(tx);
    newTx.txHash = txHash;
    newTx.error = error;
    insertOutgoing(client, session, newTx, satoshis, newTx.fiat, 'partial_send',
        authority, function(_err) {
      done();
      if (err) logger.error(_err);
    });
  });
};

function maybeRemovePending(client, session, authority, cb) {
  if (authority === 'published') return cb();
  removePendingTx(client, session, cb);
}

exports.addIncomingTx = function addIncomingTx(session, tx, authority,
    satoshisReceived, cb) {

  connect(function(err, client, done) {
    if (err) return cb(err);
    async.waterfall([
      async.apply(silentQuery, client, 'BEGIN', null),
      async.apply(maybeRemovePending, client, session, authority),
      async.apply(insertIncoming, client, session, tx, satoshisReceived, 0,
        'deposit', authority)
    ], function(err) {
      if (err) {
        rollback(client, done);
        return cb(err);
      }
      silentQuery(client, 'COMMIT', null, function() {
        done();
        cb();
      });
    });
  });
};

exports.addInitialIncoming = function addInitialIncoming(session, tx, cb) {
  console.log('DEBUG1: %s', tx.currencyCode);
  connect(function(err, client, done) {
    if (err) return cb(err);
    async.waterfall([
      async.apply(silentQuery, client, 'BEGIN', null),
      async.apply(addPendingTx, client, session, true, tx.currencyCode,
        tx.toAddress),
      async.apply(insertIncoming, client, session, tx, tx.satoshis, tx.fiat,
        'initial_request', 'pending')
    ], function(err) {
      if (err) {
        rollback(client, done);
        return cb(err);
      }
      silentQuery(client, 'COMMIT', null, function() {
        done();
        cb();
      });
    });
  });
};

function lastTxStatus(client, session, cb) {
  var sql = 'SELECT satoshis, authority FROM transactions ' +
    'WHERE device_fingerprint=$1 AND session_id=$2 AND incoming=$3 ' +
    'ORDER BY id DESC LIMIT 1';
  var values = [session.fingerprint, session.id, true];

  query(client, sql, values, cb);
}

function initialRequest(client, session, cb) {
  var sql = 'SELECT fiat, satoshis FROM transactions ' +
    'WHERE device_fingerprint=$1 AND session_id=$2 AND incoming=$3 ' +
    'AND stage=$4';
  var values = [session.fingerprint, session.id, true, 'initial_request'];

  query(client, sql, values, cb);
}

exports.dispenseStatus = function dispenseStatus(session, cb) {
  connect(function(err, client, done) {
    if (err) return cb(err);

    async.parallel([
      async.apply(initialRequest, client, session),
      async.apply(lastTxStatus, client, session)
    ], function(_err, results) {
      done();
      if (_err) return cb(_err);

      var pending = (results[0].rows.length === 1) &&
        (results[1].rows.length === 1) &&
        (results[1].rows[0].stage == 'deposit');
      if (!pending) return cb(null, null);

      var requiredSatoshis = results[0].rows[0].requiredSatoshis;
      var lastTx = results[1].rows[1];

      // TODO: handle multiple deposits
      var status = (lastTx.satoshis < requiredSatoshis) ?
        'insufficientFunds' :
        lastTx.authority;
      cb(null, status);
    });
  });
};

function lastDispenseCount(client, session, transactionId, cb) {
  var sql = 'SELECT count1, count2 FROM dispenses ' +
    'WHERE device_fingerprint=$1 ' +
    'ORDER BY id DESC LIMIT 1';
  client.query(sql, [session.fingerprint], function(err, results) {
    if (err) return cb(err);
    if (results.rows.length === 0) return cb(null, [0, 0]);
    cb(null, transactionId, [results.rows[0].count1, results.rows[0].count2]);
  });
}

function insertDispense(client, tx, transactionId, counts, cb) {
  var fields = [
    'transaction_id',
    'dispense1', 'reject1', 'count1',
    'dispense2', 'reject2', 'count2',
    'refill', 'error'
  ];

  var sql = getInsertQuery('dispenses', fields, true);

  var dispense1 = tx.billDistribution[0].actualDispense;
  var dispense2 = tx.billDistribution[1].actualDispense;
  var reject1 = tx.billDistribution[0].rejected;
  var reject2 = tx.billDistribution[1].rejected;
  var count1 = Math.max(counts[0] - (dispense1 + reject1), 0);
  var count2 = Math.max(counts[1] - (dispense2 + reject2), 0);
  var values = [
    transactionId,
    dispense1, reject1, count1, dispense2, reject2, count2,
    false, tx.error
  ];
  client.query(sql, values, cb);
}

exports.addDispense = function addDispense(session, tx) {
  connect(function(err, client, done) {
    if (err) return logger.error(err);

    async.waterfall([
      async.apply(insertIncoming, client, session, tx, 0, tx.fiat,
        'deposit', 'authorized'),
      async.apply(lastDispenseCount, client, session),
      async.apply(insertDispense, client, tx)
    ], function(_err) {
      done();
      if (_err) logger.error(err);
    });
  });
};
