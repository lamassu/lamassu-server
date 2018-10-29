var db = require('./db')

exports.up = function (next) {
  var sql = [
    db.addColumn('cash_out_txs', 'layer_2_address', 'text null'),
    db.addColumn('cash_out_actions', 'layer_2_address', 'text null')
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
