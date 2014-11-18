'use strict';

var pg = require('pg');
var async   = require('async');
var _ = require('lodash');

var logger = require('./logger');

var PG_ERRORS = {
  23505: 'uniqueViolation'
};

var client = null;

function rollback(client) {
  //terminating a client connection will
  //automatically rollback any uncommitted transactions
  //so while it's not technically mandatory to call
  //ROLLBACK it is cleaner and more correct
  logger.warn('Rolling back transaction.');
  client.query('ROLLBACK', function() {
    client.end();
  });
}

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

function query(queryStr, values, cb) {
  client.query(queryStr, values, cb);
}

function silentQuery(queryStr, values, cb) {
  client.query(queryStr, values, function(err) {
    cb(err);
  });
}

function billsAndTxs(txid, currencyCode, deviceFingerprint, cb) {
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
    async.apply(query, billsQuery, billsValues),
    async.apply(query, txQuery, txValues)
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
      'computeSendAmount result < 0, this shouldn\'t happen');
    result.fiat = 0;
    result.satoshis = 0;
  }
  return result;
}

function insertTx(deviceFingerprint, tx, totals, cb) {
  var sendAmount = computeSendAmount(tx, totals);
  if (sendAmount.satoshis === 0) return cb();

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
    _.isNumber(tx.fiat) ? 'machineSend' : 'timeout',
    tx.tx_type || 'buy',
    deviceFingerprint,
    tx.toAddress,
    sendAmount.satoshis,
    tx.currencyCode,
    sendAmount.fiat
  ];

  query(getInsertQuery('transactions', fields), values, function(err, result) {
    // unique violation shouldn't happen, since then sendAmount would be 0
    if (err) return cb(err);
    cb(null, sendAmount.satoshis);
  });
}

function processTx(deviceFingerprint, tx, cb) {
  async.waterfall([
    async.apply(silentQuery, 'BEGIN'),
    async.apply(billsAndTxs, tx.currencyCode, deviceFingerprint),
    async.apply(insertTx, deviceFingerprint, tx)
  ], function(err, satoshisToSend) {
    // if (err) DO some rollback
    silentQuery('COMMIT', function() {
      client.end();
      cb(null, satoshisToSend);
    });
  });
}

/*
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

  // ----------------

  async.waterfall([
    async.apply(query, 'BEGIN'),
    async.apply(query, 'BEGIN'),
  ])
  client.query('BEGIN', function(err, result) {
  if(err) return rollback(client);
  client.query('INSERT INTO account(money) VALUES(100) WHERE id = $1', [1], function(err, result) {
    if(err) return rollback(client);
    client.query('INSERT INTO account(money) VALUES(-100) WHERE id = $1', [2], function(err, result) {
      if(err) return rollback(client);
      //disconnect after successful commit
      client.query('COMMIT', client.end.bind(client));
    });
  });
});
};
*/

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

var tx = {fiat: 100, satoshis: 10090000};
exports.init('psql://lamassu:lamassu@localhost/lamassu');
billsAndTxs('5ef9c631-d948-4f0f-bf22-d2a563f5cd26', 'USD', 'AB:9C:09:AA:7B:48:51:9A:0E:13:59:4E:5E:69:D0:74:E5:0F:4A:66',
  function(err, result) { console.dir(err); console.dir(result);
    console.dir(computeSendAmount(tx, result));
  });
