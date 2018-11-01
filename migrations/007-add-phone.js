var db = require('./db')

exports.up = function (next) {
  var sql = [
    db.addColumn('transactions', 'phone', 'text'),
    'create index on transactions (phone)'
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
