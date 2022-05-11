var db = require('./db')

exports.up = function (next) {
  const sql = [
    'alter table cash_in_txs drop column device_time',
    'alter table cash_out_txs drop column device_time'
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
