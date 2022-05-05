const db = require('./db')

exports.up = function (next) {
  var sql = [
    'ALTER TABLE cash_out_txs ADD COLUMN received_crypto_atoms numeric(30) null DEFAULT null'
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
