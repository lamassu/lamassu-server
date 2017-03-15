var db = require('./db')

exports.up = function (next) {
  var sql = [
    'alter table cash_in_txs add column send boolean not null default false',
    'alter table cash_in_txs rename currency_code to fiat_code',
    'alter table cash_out_txs rename currency_code to fiat_code'
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
