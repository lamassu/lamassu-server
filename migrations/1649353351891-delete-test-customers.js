var db = require('./db')

exports.up = function (next) {
  var sql = [
    `ALTER TABLE customers ADD COLUMN enabled BOOLEAN NOT NULL DEFAULT true`,
    `ALTER TABLE customers DROP CONSTRAINT customers_phone_key`,
    `CREATE UNIQUE INDEX customers_phone_key ON customers (phone) WHERE enabled`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
