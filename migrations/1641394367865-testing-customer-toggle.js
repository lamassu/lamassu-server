var db = require('./db')

exports.up = function (next) {
  var sql = [
    `ALTER TABLE customers ADD COLUMN is_test_customer BOOLEAN NOT NULL DEFAULT false`,
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
