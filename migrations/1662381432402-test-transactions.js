var db = require('./db')

exports.up = function (next) {
  const sql = [
    `CREATE TABLE testing_addresses (
        crypto_code TEXT NOT NULL,
        address TEXT NOT NULL,
        unique (crypto_code, address)
      )`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
