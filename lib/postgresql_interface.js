'use strict';

var pg = require('pg');
var logger = require('./logger');

var PG_ERRORS = {
  23505: 'uniqueViolation'
};

var client = null;

exports.init = function init(conString) {
  if (client !== null) return;

  if (!conString) {
    throw new Error('Postgres connection string is required');
  }

  client = new pg.Client(conString);
  client.on('error', function (err) { logger.error(err); });

  client.connect();
};


exports.recordBill = function recordBill(deviceFingerprint, rec, cb) {
  client.query('INSERT INTO bills (device_fingerprint, denomination, currency_code, ' +
    'satoshis, to_address, transaction_id, device_time) ' +
    'VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [deviceFingerprint, rec.fiat, rec.currency, rec.satoshis, rec.toAddress, rec.txId, rec.deviceTime],
    cb);
};

exports.recordDeviceEvent = function recordDeviceEvent(deviceFingerprint, event, cb) {
  client.query('INSERT INTO device_events (device_fingerprint, event_type, note, device_time)' +
    'VALUES ($1, $2, $3, $4)',
    [deviceFingerprint, event.eventType, event.note, event.deviceTime],
    cb);
};

// each received "partial transaction" contains sum of all previous bills
//  (vel. no need to do any server-side summing)
function updatePartialTransaction(values, cb) {
  var values2 = [
    values[4],
    values[6],
    values[0],
    'partial'
  ];
  client.query('UPDATE transactions SET ' +
    'satoshis=$1, ' +
    'fiat=$2 ' +
    'WHERE id=$3 AND status=$4',
    values2,
    cb);
}
exports.getTransaction = function getTransaction(txId, cb) {
  client.query('SELECT * FROM transactions WHERE id=$1',
    [txId],
    function(err, results) {
      if (err) return cb(err);

      cb(null, results.rows.length >= 0 && results.rows[0]);
    });
};
exports.fetchTransaction = function fetchTransaction(txId, cb) {
  exports.getTransaction(txId, function(err, tx) {
    if (err) return cb(err);

    if (!tx)
      return cb(new Error('Couldn\'t find transaction.'));

    cb(null, {
      txHash: tx.tx_hash,
      err:    tx.error,
      status: tx.status
    });
  });
}
exports.summonTransaction = function summonTransaction(deviceFingerprint, tx, cb) {
  var status = tx.status || 'pending';

  var values = [
    tx.txId,
    status,
    deviceFingerprint,
    tx.toAddress,
    tx.satoshis,
    tx.currencyCode,
    tx.fiat
  ];

  // First attampt an INSERT
  // If it worked, go ahead with transaction
  // If duplicate and partial update with new bills
  // If duplicate, but not partial fetch status and return

  client.query('INSERT INTO transactions ' +
    '(id, status, device_fingerprint, to_address, satoshis, currency_code, fiat) ' +
    'VALUES ($1, $2, $3, $4, $5, $6, $7)',
    values,
    function(err) {
      if (err) {
        if (PG_ERRORS[err.code] === 'uniqueViolation') {
          if (status === 'partial')
            return updatePartialTransaction(values, cb);

          return exports.fetchTransaction(tx.txId, cb);
        }

        return cb(err);
      }

      cb();
    });
};


exports.reportTransactionError = function reportTransactionError(tx, errString, status) {
  client.query('UPDATE transactions SET status=$1, error=$2 WHERE id=$3',
    [status, errString, tx.txId]);
};

exports.completeTransaction = function completeTransaction(tx, txHash) {
  if (txHash)
    client.query('UPDATE transactions SET tx_hash=$1, status=$2, completed=now() WHERE id=$3',
      [txHash, 'completed', tx.txId]);
  else
    client.query('UPDATE transactions SET status=$1, error=$2 WHERE id=$3',
      ['failed', 'No txHash received', tx.txId]);
};
