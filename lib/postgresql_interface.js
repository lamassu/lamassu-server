'use strict';

var pg = require('pg');
var logger = require('./logger');

var PG_ERRORS = {
  23505: 'uniqueViolation'
};

var client = null;


function getInsertQuery(tableName, fields) {

  // outputs string like: '$1, $2, $3...' with proper No of items
  var placeholders = fields.map(function(_, i) {
    return '$' + (i + 1);
  }).join(', ');

  return 'INSERT INTO ' + tableName +
    ' (' + fields.join(', ') + ')' +
    ' VALUES' +
    ' (' + placeholders + ')';
}


exports.init = function init(conString) {
  if (client !== null) return;

  if (!conString) {
    throw new Error('Postgres connection string is required');
  }

  client = new pg.Client(conString);
  client.on('error', function (err) { logger.error(err); });

  client.connect();
};


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
    res.txId,
    rec.deviceTime,

    rec.satoshis,
    rec.fiat
  ];

  if (rec.partialTx) {
    values.push(rec.partialTx.satoshis, rec.partialTx.fiat);
    fields.push('total_satoshis', 'total_fiat');
  }

  client.query(getInsertQuery('bills', fields), values, cb);
};

exports.recordDeviceEvent = function recordDeviceEvent(deviceFingerprint, event, cb) {
  client.query('INSERT INTO device_events (device_fingerprint, event_type, note, device_time)' +
    'VALUES ($1, $2, $3, $4)',
    [deviceFingerprint, event.eventType, event.note, event.deviceTime],
    cb);
};

function _getTransactions(txId, onlyPending, cb) {
  var query = 'SELECT * FROM transactions WHERE id=$1';
  var values = [txId];

  if (onlyPending) {
    query += ' AND status=$2 AND tx_hash IS NULL';
    values.push('pending');
  }

  client.query(query, values, function(err, results) {
    if (err) return cb(err);

    if (results.rows.length === 0)
      return cb(new Error('Couldn\'t find transaction'));

    cb(null, results.rows);
  });
}

// returns complete [txs]
exports.getTransactions = function getTransactions(txId, cb) {
  _getTransactions(txId, false, cb);
};

// TODO: this should probably return bills, associated with failed/inexistent tx
exports.getPendingTransactions = function getPendingTransactions(txId, cb) {
  // should return
  //    is_completed === false
  //    amount from bils is less than sum of all parts with the same txId
  //    latest bill with txId not present in transactions
  //
  _getTransactions(txId, true, cb);
};

exports.summonTransaction = function summonTransaction(deviceFingerprint, tx, cb) {
  var fields = [
    'id',
    'status',
    'device_fingerprint',
    'to_address',
    'satoshis',
    'currency_code',
    'fiat'
  ];

  var values = [
    tx.txId,
    tx.status || 'pending',
    deviceFingerprint,
    tx.toAddress,
    tx.satoshis,
    tx.currencyCode,
    tx.fiat
  ];

  if (tx.part && tx.part > 1) {
    fields.push('part');
    values.push(tx.part);
  }

  // First attampt an INSERT
  // If it worked, go ahead with transaction
  client.query(getInsertQuery('transactions', fields),
    values,
    function(err) {
      if (err) {
        if (PG_ERRORS[err.code] === 'uniqueViolation')
          return exports.getTransactions(tx.txId, cb);

        return cb(err);
      }

      cb();
    });
};

// `@more` can contain `part`, `hash`, or `error`
exports.changeTxStatus = function changeTxStatus(txId, newStatus, more, cb) {
  cb = typeof cb === 'function' ? cb : function() {};

  var query = 'UPDATE transactions SET status=$1';
  var values = [
    newStatus
  ];

  var n = 2;

  if (newStatus === 'error') {
    query += ', error=$' + n++;
    values.push(more.error);
  }

  if (newStatus === 'completed') {
    query += ', tx_hash=$' + n++;
    values.push(more.hash);
  }

  query += ' WHERE id=$' + n;
  values.push(txId);

  client.query(query, values, cb);
};
