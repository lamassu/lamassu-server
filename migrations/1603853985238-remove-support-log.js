var db = require('./db')

exports.up = function (next) {
  var sql = [
    'drop table if exists support_logs',
    'drop table if exists server_support_logs'
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
