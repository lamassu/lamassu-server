'use strict';

var pg = require('pg');
var async   = require('async');
var _ = require('lodash');

var logger = require('./logger');

var PG_ERRORS = {
  23505: 'uniqueViolation'
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
exports.recordBill = function recordBill(deviceFingerprint, rec, cb) {
  var fields = [
    'device_fingerprint',
    'currency_code',
    'to_address',
    'transaction_id',
    'device_time',

    'satoshis',
    'denomination'
  ];

  var values = [
    deviceFingerprint,
    rec.currency,
    rec.toAddress,
    rec.txId,
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

exports.recordDeviceEvent = function recordDeviceEvent(deviceFingerprint, event) {
  connect(function(err, client, done) {
    if (err) return;
    client.query('INSERT INTO device_events (device_fingerprint, event_type, note, device_time)' +
      'VALUES ($1, $2, $3, $4)',
      [deviceFingerprint, event.eventType, event.note, event.deviceTime],
      done);
  });
};

function query(client, queryStr, values, cb) {
  console.dir([queryStr, values]);
  client.query(queryStr, values, cb);
}

function silentQuery(client, queryStr, values, cb) {
  console.dir([queryStr, values]);
  client.query(queryStr, values, function(err) {
    cb(err);
  });
}

// OPTIMIZE: No need to query bills if tx.fiat and tx.satoshis are set
function billsAndTxs(client, txid, currencyCode, deviceFingerprint, cb) {
  var billsQuery = 'SELECT COALESCE(SUM(denomination), 0) as fiat, ' +
    'COALESCE(SUM(satoshis), 0) AS satoshis ' +
    'FROM bills ' +
    'WHERE transaction_id=$1 AND currency_code=$2 AND device_fingerprint=$3';
  var billsValues = [txid, currencyCode, deviceFingerprint];
  var txQuery = 'SELECT COALESCE(SUM(fiat), 0) AS fiat, ' +
    'COALESCE(SUM(satoshis), 0) AS satoshis ' +
    'FROM transactions ' +
    'WHERE txid=$1 AND currency_code=$2 AND device_fingerprint=$3';
  var txValues = billsValues; // They happen to be the same

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
      'computeSendAmount result < 0, this shouldn\'t happen. Maybe timeout arrived after machineSend.');
    result.fiat = 0;
    result.satoshis = 0;
  }
  return result;
}

exports.pendingTxs = function pendingTxs(timeoutMS, cb) {
  connect(function(err, client, done) {
    var sql = 'SELECT * FROM transactions ' +
      'WHERE status=$1 AND ' +
      'EXTRACT(EPOCH FROM now() - created) > $2 ' +
      'ORDER BY created ASC';
    var timeoutS = timeoutMS / 1000;
    var values = ['pending', timeoutS];
    query(client, sql, values, function(err, results) {
      done();
      cb(err, results);
    });
  });
};

function removePendingTx(client, tx, cb) {
  silentQuery(client, 'DELETE FROM transactions WHERE txid=$1 AND status=$2',
    [tx.txId, 'pending'], cb);
}

function maybeInsertTx(client, deviceFingerprint, tx, totals, cb) {
  var sendAmount = computeSendAmount(tx, totals);
  var status = _.isNumber(tx.fiat) ? 'machineSend' : 'timeout';
  var satoshis = sendAmount.satoshis;
  var fiat = sendAmount.fiat;
  insertTx(client, deviceFingerprint, tx, satoshis, fiat, status, function(err, results) {
    // TODO: Don't worry about unique violation
    if (err) return cb(err);
    cb(null, {id: results.rows[0].id, satoshisToSend: sendAmount.satoshis});
  });
}

function insertTx(client, deviceFingerprint, tx, satoshis, fiat, status, cb) {
  var fields = [
    'txid',
    'status',
    'tx_type',
    'device_fingerprint',
    'to_address',
    'satoshis',
    'currency_code',
    'fiat'
  ];

  var values = [
    tx.txId,
    status,
    tx.tx_type || 'buy',
    deviceFingerprint,
    tx.toAddress,
    satoshis,
    tx.currencyCode,
    fiat
  ];

  query(client, getInsertQuery('transactions', fields, true), values, cb);
}

exports.addPendingTx = function addPendingTx(deviceFingerprint, tx) {
  connect(function(err, client, done) {
    if (err) return;
    insertTx(client, deviceFingerprint, tx, 0, 0, 'pending',
      function(err) {
        done();

        // If pending tx already exists, do nothing
        if (err && PG_ERRORS[err.code] !== 'uniqueViolation')
          logger.error(err);
      });
  });
};

// Calling function should only send bitcoins if result.satoshisToSend > 0
exports.addTx = function addTx(deviceFingerprint, tx, cb) {
  connect(function(err, client, done) {
    if (err) return cb(err);
    async.waterfall([
      async.apply(silentQuery, client, 'BEGIN', null),
      async.apply(removePendingTx, client, tx),
      async.apply(billsAndTxs, client, tx.txId, tx.currencyCode, deviceFingerprint),
      async.apply(maybeInsertTx, client, deviceFingerprint, tx)
    ], function(err, result) {
      if (err) {
        rollback(client, done);
        return cb(err);
      }
      silentQuery(client, 'COMMIT', null, function() {
        done();
        cb(null, result);
      });
    });
  });
};

exports.addDigitalTx = function addDigitalTx(dbTxId, err, txHash) {
  var keys = ['transaction_id', 'tx_hash', 'error'];
  var values = [dbTxId, txHash, err && err.message];
  var sql = getInsertQuery('digital_transactions', keys);

  connect(function(err, client, done) {
    query(client, sql, values, function(_err) {
      done(_err);
      if (_err) logger.error(_err);
    });
  });
};

/*
exports.decrementCartridges =
    function decrementCartridges(fingerprint, cartridge1, cartridge2, cb) {
  var query = 'UPDATE devices SET cartridge_1_bills = cartridge_1_bills - $1, ' +
    'cartridge_2_bills = cartridge_2_bills - $2 ' +
    'WHERE fingerprint = $3';
  client.query(query, [cartridge1, cartridge2, fingerprint], cb);
};

exports.fillCartridges =
    function fillCartridges(fingerprint, cartridge1, cartridge2, cb) {
  var query = 'UPDATE devices SET cartridge_1_bills = $1, ' +
    'cartridge_2_bills = $2 ' +
    'WHERE fingerprint = $3';
  client.query(query, [cartridge1, cartridge2, fingerprint], cb);
};
*/
/*
exports.init('psql://lamassu:lamassu@localhost/lamassu');

var fp = 'AB:9C:09:AA:7B:48:51:9A:0E:13:59:4E:5E:69:D0:74:E5:0F:4A:66';
var txId = '5ef9c631-d948-4f0f-bf22-d2a563f5cd26';
var tx = {txId: txId, currencyCode: 'USD', toAddress: '1xxx'};
exports.addDigitalTx(198, new Error('insufficient funds'), null, function(err, result) { pg.end(); console.dir(result); });
*/
