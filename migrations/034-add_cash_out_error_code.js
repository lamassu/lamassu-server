var db = require('./db')

exports.up = function (next) {
  var sql = [
    db.addColumn('cash_out_txs', 'error_code', 'text')
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
