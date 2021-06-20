var db = require('./db')

exports.up = function (next) {
  var sql = [
    `INSERT INTO blacklist SELECT DISTINCT crypto_code, to_address, false FROM cash_in_txs ON CONFLICT DO NOTHING`,
    `INSERT INTO blacklist SELECT DISTINCT crypto_code, to_address, false FROM cash_out_txs ON CONFLICT DO NOTHING`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
