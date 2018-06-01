var db = require('./db')

exports.up = function (next) {
  const sql = [
    'alter table cash_in_txs add column terms_accepted boolean not null default false',
    'alter table cash_out_txs add column terms_accepted boolean not null default false'
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
