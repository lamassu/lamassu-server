var db = require('./db')

exports.up = function (next) {
  const sql = [
    'alter table cash_out_txs add column published_at timestamptz',
    'alter table cash_out_txs rename column confirmation_time to confirmed_at'
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
