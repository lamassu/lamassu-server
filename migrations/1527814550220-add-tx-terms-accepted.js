var db = require('./db')

exports.up = function (next) {
  const sql = [
    db.addColumn('cash_in_txs', 'terms_accepted', 'boolean not null default false'),
    db.addColumn('cash_out_txs', 'terms_accepted', 'boolean not null default false')
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
