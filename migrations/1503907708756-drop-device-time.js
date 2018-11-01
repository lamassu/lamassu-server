var db = require('./db')

exports.up = function (next) {
  const sql = [
    db.dropColumn('cash_in_txs', 'device_time'),
    db.dropColumn('cash_out_txs', 'device_time')
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
