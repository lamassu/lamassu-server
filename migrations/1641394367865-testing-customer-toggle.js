var db = require('./db')

exports.up = function (next) {
  var sql = [
    `ALTER TABLE customers ADD COLUMN is_test_customer BOOLEAN DEFAULT false`,
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
