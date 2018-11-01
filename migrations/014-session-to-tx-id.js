var db = require('./db')

exports.up = function (next) {
  var sql = [
    db.renameColumn('bills', 'device_fingerprint', 'device_id'),
    db.renameColumn('bills', 'satoshis', 'crypto_atoms'),
    db.renameColumn('bills', 'session_id', 'cash_in_txs_id'),

    db.renameColumn('cached_responses', 'device_fingerprint', 'device_id'),
    db.renameColumn('cached_responses', 'session_id', 'tx_id'),

    db.renameColumn('cash_in_txs', 'session_id', 'id'),
    db.renameColumn('cash_in_txs', 'device_fingerprint', 'device_id'),

    db.renameColumn('cash_out_actions', 'session_id', 'cash_out_txs_id'),

    db.renameColumn('cash_out_hds', 'session_id', 'id'),

    db.renameColumn('cash_out_txs', 'session_id', 'id'),
    db.renameColumn('cash_out_txs', 'device_fingerprint', 'device_id'),

    db.renameColumn('devices', 'fingerprint', 'device_id'),

    db.renameColumn('dispenses', 'session_id', 'cash_out_txs_id'),
    db.renameColumn('dispenses', 'device_fingerprint', 'device_id'),

    db.renameColumn('machine_configs', 'device_fingerprint', 'device_id'),

    db.renameColumn('machine_events', 'device_fingerprint', 'device_id')
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
