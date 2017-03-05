var db = require('./db')

exports.up = function (next) {
  var sql = [
    'alter table cash_in_txs add column sent boolean not null default false'
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
