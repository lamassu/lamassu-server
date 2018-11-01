var db = require('./db')

exports.up = function (next) {
  var sql = [
    db.alterColumn('cash_in_txs', 'cash_in_fee_crypto', 'type numeric(30)'),
    db.alterColumn('cash_in_txs', 'crypto_atoms', 'type numeric(30)'),
    db.alterColumn('cash_out_txs', 'crypto_atoms', 'type numeric(30)'),
    db.alterColumn('trades', 'crypto_atoms', 'type numeric(30)'),
    db.alterColumn('bills', 'crypto_atoms', 'type numeric(30)'),
    db.alterColumn('bills', 'cash_in_fee_crypto', 'type numeric(30)'),
    db.alterColumn('bills', 'crypto_atoms_after_fee', 'type numeric(30)')
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
