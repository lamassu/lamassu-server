const db = require('./db')

exports.up = function (next) {
  var sql = [
    "ALTER TABLE customers ADD COLUMN suspended_until timestamptz"
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
