var db = require('./db')

exports.up = function (next) {
  var sql = [
    'alter table cash_out_txs add column layer_2_address text null',
    'alter table cash_out_actions add column layer_2_address text null'
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
