const db = require('./db')

exports.up = function (next) {
  var sql = [
    'ALTER TABLE cash_in_txs DROP COLUMN cash_in_fee_crypto'
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
