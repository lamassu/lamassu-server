var db = require('./db')

exports.up = function (next) {
  const sql = [
    db.addColumn('cash_in_txs', 'tx_version', 'integer not null'),
    db.addColumn('cash_out_txs', 'tx_version', 'integer not null')
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
