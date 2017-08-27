var db = require('./db')

exports.up = function (next) {
  const sql = [
    'alter table cash_in_txs add column tx_version integer not null',
    'alter table cash_out_txs add column tx_version integer not null'
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
