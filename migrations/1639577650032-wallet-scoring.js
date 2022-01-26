var db = require('./db')

exports.up = function (next) {
  var sql = [
    `ALTER TABLE cash_in_txs ADD COLUMN wallet_score SMALLINT`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
