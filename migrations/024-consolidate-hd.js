var db = require('./db')

exports.up = function (next) {
  var sql = [
    'create sequence hd_indices_seq minvalue 0 maxvalue 2147483647',
    'alter table cash_out_txs add column hd_index integer',
    'alter sequence hd_indices_seq owned by cash_out_txs.hd_index',
    "alter table cash_out_txs add column swept boolean not null default 'f'",
    'alter table cash_out_txs drop column tx_hash',
    'create unique index on cash_out_txs (hd_index)',
    'drop table cash_out_hds',
    'drop table cash_out_actions',
    'drop table transactions',
    'drop table idempotents',
    'drop table machine_configs',
    'drop table pending_transactions'
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
