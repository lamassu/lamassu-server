'use strict';

var pg = require('pg');
var logger = require('./logger');

var PG_ERRORS = {
  23505: 'uniqueViolation'
};

var PostgresqlInterface = function (conString) {
  if (!conString) {
    throw new Error('Postgres connection string is required');
  }

  this.client = new pg.Client(conString);
  this.client.on('error', function (err) { logger.error(err); });

  this.client.connect();
};
PostgresqlInterface.factory = function factory(conString) { return new PostgresqlInterface(conString); };
module.exports = PostgresqlInterface;

PostgresqlInterface.prototype.recordBill = 
  function recordBill(deviceFingerprint, rec, cb) {

  this.client.query('INSERT INTO bills (device_fingerprint, denomination, currency_code, ' +
    'transaction_id) ' +
    'VALUES ($1, $2, $3, $4)',
    [deviceFingerprint, rec.fiat, rec.currency, rec.txId],
    cb);
};

PostgresqlInterface.prototype.recordBillValidatorEvent = 
  function recordBillValidatorEvent(deviceFingerprint, event, cb) {

  this.client.query('INSERT INTO bill_validator_events (device_fingerprint, event_type, note)' +
    'VALUES ($1, $2, $3)',
    [deviceFingerprint, event.eventType, event.note],
    cb);
};

PostgresqlInterface.prototype.summonTransaction = 
  function summonTransaction(deviceFingerprint, tx, cb) {
  // First do an INSERT
  // If it worked, go ahead with transaction
  // If duplicate, fetch status and return
  var self = this;
  this.client.query('INSERT INTO transactions (id, status, device_fingerprint, ' +
      'to_address, satoshis, currency_code, fiat) ' + 
      'VALUES ($1, $2, $3, $4, $5, $6, $7)', [tx.txId, 'pending', deviceFingerprint,
      tx.toAddress, tx.satoshis, tx.currencyCode, tx.fiat], 
      function (err) {
    if (err && PG_ERRORS[err.code] === 'uniqueViolation')
      return self._fetchTransaction(tx.txId, cb);
    if (err) return cb(err);
    cb();
  });
};

PostgresqlInterface.prototype.reportTransactionError = 
  function reportTransactionError(tx, errString, status) {
  this.client.query('UPDATE transactions SET status=$1, error=$2 WHERE id=$3', 
    [status, errString, tx.txId]);
};

PostgresqlInterface.prototype.completeTransaction = 
  function completeTransaction(tx, txHash) {
  if (txHash)
    this.client.query('UPDATE transactions SET tx_hash=$1, status=$2, completed=now() WHERE id=$3', 
      [txHash, 'completed', tx.txId]);
  else
    this.client.query('UPDATE transactions SET status=$1, error=$2 WHERE id=$3', 
      ['failed', 'No txHash received', tx.txId]);    
};

PostgresqlInterface.prototype._fetchTransaction = 
    function _fetchTransaction(txId, cb) {
  this.client.query('SELECT status, tx_hash, error FROM transactions WHERE id=$1',
      [txId], function (err, results) {
    if (err) return cb(err);

    // This should never happen, since we already checked for existence
    if (results.rows.length === 0) return cb(new Error('Couldn\'t find transaction.')); 

    var result = results.rows[0];
    cb(null, {txHash: result.tx_hash, err: result.error, status: result.status});
  });
};
