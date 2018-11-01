var db = require('./db')

exports.up = function (next) {
  var sql = [
    db.addColumn('cash_in_txs', 'cash_in_fee', 'numeric(14, 5) not null'),
    db.addColumn('cash_in_txs', 'cash_in_fee_crypto', 'bigint not null'),
    db.addColumn('cash_in_txs', 'minimum_tx', 'integer not null'),
    db.addColumn('bills', 'cash_in_fee', 'numeric(14, 5) not null'),
    db.addColumn('bills', 'cash_in_fee_crypto', 'bigint not null'),
    db.addColumn('bills', 'crypto_atoms_after_fee', 'bigint not null')
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
