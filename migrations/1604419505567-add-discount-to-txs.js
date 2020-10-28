const db = require('./db')

exports.up = function (next) {
  var sql = [
    'alter table cash_in_txs add column discount smallint',
    'alter table cash_out_txs add column discount smallint'
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
