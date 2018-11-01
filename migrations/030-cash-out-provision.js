var db = require('./db')

exports.up = function (next) {
  var sql = [
    db.addColumn('cash_out_txs', 'provisioned_1', 'integer'),
    db.addColumn('cash_out_txs', 'provisioned_2', 'integer'),
    db.addColumn('cash_out_txs', 'denomination_1', 'integer'),
    db.addColumn('cash_out_txs', 'denomination_2', 'integer')
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
