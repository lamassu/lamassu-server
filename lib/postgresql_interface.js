'use strict';

var pg = require('pg');
var async   = require('async');

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
    rec.txId,
    rec.deviceTime,

    rec.satoshis,
    rec.fiat
  ];

  if (rec.partialTx) {
    values.push(rec.partialTx.satoshis, rec.partialTx.fiat);
    fields.push('total_satoshis', 'total_fiat');
  }

  // NOTE: if is here to maintain compatibility with older machines
  if (rec.uuid) {
    values.push(rec.uuid);
    fields.push('uuid');
  }

  client.query(getInsertQuery('bills', fields), values, function(err) {
    if (err && PG_ERRORS[err.code] === 'uniqueViolation')
      return cb(null, {code: 204});

    cb(); // 201 => Accepted / saved
  });
};

exports.recordDeviceEvent = function recordDeviceEvent(deviceFingerprint, event, cb) {
  client.query('INSERT INTO device_events (device_fingerprint, event_type, note, device_time)' +
    'VALUES ($1, $2, $3, $4)',
    [deviceFingerprint, event.eventType, event.note, event.deviceTime],
    cb);
};

exports.getPendingAmount = function getPendingAmount(txId, cb) {
  async.parallel({
    // NOTE: `async.apply()` would strip context here
    txs: function(_cb) {
      client.query(
        'SELECT * FROM transactions WHERE id=$1',
        [txId],
        _cb
      );
    },
    bills: function(_cb) {
      client.query(
        'SELECT * FROM bills WHERE transaction_id=$1 ORDER BY device_time DESC',
        [txId],
        _cb
      );
    }
  }, function(err, results) {
    if (err) return cb(err);

    // No bills == nothing to do
    if (results.bills.rows.length === 0)
      return cb();

    var lastBill = results.bills.rows[0];

    var newTx = {
      txId: txId,
      satoshis: lastBill.total_satoshis,
      fiat: lastBill.total_fiat,
      deviceFingerprint: lastBill.device_fingerprint,
      toAddress: lastBill.to_address,
      currencyCode: lastBill.currency_code
    };

    // if there are txs, substract already sent amount
    if (results.txs.rows.length > 0) {
      newTx.partial_id = results.txs.rows.length + 1;
      newTx.satoshis = lastBill.total_satoshis;
      newTx.fiat = lastBill.total_fiat;

      results.txs.rows.forEach(function(tx) {
        // try sending again only in case of a fail due to insufficientFunds
        if (tx.status !== 'insufficientFunds') {
          newTx.satoshis -= tx.satoshis;
          newTx.fiat -= tx.fiat;
        }
      });
    }

    // Nothing to send == nothing to do
    if (newTx.satoshis <= 0) {
      if (newTx.satoshis < 0)
        logger.error('Negative tx amount (%d) for txId: %s', newTx.satoshis, txId);

      return cb();
    }

    cb(null, newTx);
  });
};

exports.insertTx = function insertTx(deviceFingerprint, tx, cb) {
  var fields = [
    'id',
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
    tx.status || 'pending',
    tx.tx_type || 'buy',
    deviceFingerprint,
    tx.toAddress,
    tx.satoshis,
    tx.currencyCode,
    tx.fiat
  ];

  if (tx.partial_id && tx.partial_id > 1) {
    fields.push('partial_id');
    values.push(tx.partial_id);
  }

  if (typeof tx.is_completed !== 'undefined') {
    fields.push('is_completed');
    values.push(tx.is_completed);
  }

  // First attampt an INSERT
  // If it worked, go ahead with transaction
  client.query(getInsertQuery('transactions', fields),
    values,
    function(err) {
      if (err) {
        if (PG_ERRORS[err.code] === 'uniqueViolation') {
          var _err = new Error(err);
          _err.name = 'UniqueViolation';
          return cb(_err);
        }

        return cb(err);
      }

      cb();
    });
};

// `@data` can contain `partial_id`, `is_completed`, `hash`, or `error`
exports.changeTxStatus = function changeTxStatus(txId, newStatus, data, cb) {
  data = data || {};
  cb = typeof cb === 'function' ? cb : function() {};

  var query = 'UPDATE transactions SET status=$1';
  var values = [
    newStatus
  ];

  var n = 2;

  if (newStatus === 'error') {
    query += ', error=$' + n++;
    values.push(data.error);
  }

  // set tx_hash (if available)
  if (typeof data.hash !== 'undefined') {
    query += ', tx_hash=$' + n++;
    values.push(data.hash);
  }

  // indicates if tx was finished by a `/send` call (and not timeout)
  if (typeof data.is_completed !== 'undefined') {
    query += ', is_completed=$' + n++;
    values.push(data.is_completed);
  }


  query += ' WHERE id=$' + n++;
  values.push(txId);

  var partial_id = parseInt(data.partial_id);
  if (partial_id > 1) {
    query += ' AND partial_id=$' + n++;
    values.push(partial_id);
  }
  client.query(query, values, cb);
};

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
