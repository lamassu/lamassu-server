const db = require('./db')

exports.up = function (next) {
  var sql = [
    'ALTER TABLE cash_in_txs ADD COLUMN discount SMALLINT',
    'ALTER TABLE cash_out_txs ADD COLUMN discount SMALLINT'
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
