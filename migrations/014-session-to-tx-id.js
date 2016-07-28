var db = require('./db')

exports.up = function (next) {
  var sql = [
//    'alter table bills rename device_fingerprint to device_id',
//    'alter table bills rename satoshis to crypto_atoms',
//    'alter table bills rename session_id to cash_in_txs_id',

    'alter table cached_responses rename device_fingerprint to device_id',
    'alter table cached_responses rename session_id to tx_id',

    'alter table cash_in_txs rename session_id to id',
    'alter table cash_in_txs rename device_fingerprint to device_id',

    'alter table cash_out_actions rename session_id to cash_out_txs_id',

    'alter table cash_out_hds rename session_id to id',

    'alter table cash_out_txs rename session_id to id',
    'alter table cash_out_txs rename device_fingerprint to device_id',

    'alter table devices rename fingerprint to device_id',

    'alter table dispenses rename session_id to cash_out_txs_id',
    'alter table dispenses rename device_fingerprint to device_id',

    'alter table machine_configs rename device_fingerprint to device_id',

    'alter table machine_events rename device_fingerprint to device_id'
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
