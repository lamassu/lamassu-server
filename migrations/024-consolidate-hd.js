var db = require('./db')

exports.up = function (next) {
  var sql = [
    db.addSequence('hd_indices_seq', 'minvalue 0 maxvalue 2147483647'),
    db.addColumn('cash_out_txs', 'hd_index', 'integer'),
    db.alterSequence('hd_indices_seq', 'owned by cash_out_txs.hd_index'),
    db.addColumn('cash_out_txs', 'swept', 'boolean not null default \'f\''),
    db.dropColumn('cash_out_txs', 'tx_hash'),
    'create unique index on cash_out_txs (hd_index)',
    'drop table if exists cash_out_hds',
    'drop table if exists cash_out_actions',
    'drop table if exists transactions',
    'drop table if exists idempotents',
    'drop table if exists machine_configs',
    'drop table if exists pending_transactions'
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
