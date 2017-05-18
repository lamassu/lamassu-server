var db = require('./db')

exports.up = function (next) {
  var sql = [
    'alter table cash_in_txs add column cash_in_fee numeric(14, 5) not null',
    'alter table cash_in_txs add column minimum_tx integer not null'
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
