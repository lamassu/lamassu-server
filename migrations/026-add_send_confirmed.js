var db = require('./db')

exports.up = function (next) {
  var sql = [
    'alter table cash_in_txs add column send_confirmed boolean not null default false',
    'alter table cash_in_txs add column device_time bigint not null',
    'alter table cash_in_txs add column timedout boolean not null default false',
    'alter table cash_in_txs add column send_time timestamptz',
    'alter table cash_in_txs add column error_code text',
    'alter table cash_in_txs add column operator_completed boolean not null default false',
    'alter table cash_in_txs add column send_pending boolean not null default false',
    'alter table cash_out_txs add column device_time bigint not null',
    'alter table cash_out_txs add column timedout boolean not null default false'
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
