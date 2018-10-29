var db = require('./db')

exports.up = function (next) {
  const sql = [
    db.addColumn('cash_out_txs', 'published_at', 'timestamptz'),
    db.renameColumn('cash_out_txs', 'confirmation_time', 'confirmed_at')
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
