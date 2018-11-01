var db = require('./db')

exports.up = function (next) {
  var sqls = [
    db.alterColumn('transactions', 'satoshis', 'TYPE bigint'),
    db.addColumn('transactions', 'crypto_code', 'text default \'BTC\''),
    db.addColumn('pending_transactions', 'crypto_code', 'text default \'BTC\''),
    db.alterColumn('pending_transactions', 'satoshis', 'TYPE bigint'),
    db.addColumn('bills', 'crypto_code', 'text default \'BTC\''),
    db.alterColumn('bills', 'satoshis', 'TYPE bigint')
  ]

  db.multi(sqls, next)
}

exports.down = function (next) {
  next()
}
