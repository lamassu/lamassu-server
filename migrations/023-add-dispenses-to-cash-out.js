var db = require('./db')

exports.up = function (next) {
  var sql = [
    'alter table cash_out_txs add column dispensed_1 integer',
    'alter table cash_out_txs add column dispensed_2 integer',
    'alter table cash_out_txs add column rejected_1 integer',
    'alter table cash_out_txs add column rejected_2 integer',
    'alter table cash_out_txs add column denomination_1 integer',
    'alter table cash_out_txs add column denomination_2 integer',
    'alter table cash_out_txs add column dispense_error text',
    'alter table cash_out_txs add column dispense_time timestamptz',
    'drop table dispenses'
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
