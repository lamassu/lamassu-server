var db = require('./db')

exports.up = function (next) {
  const sql = [
    `CREATE TABLE testing_addresses (
        crypto_code TEXT NOT NULL,
        address TEXT NOT NULL,
        unique (crypto_code, address)
      )`,
    `ALTER TABLE cash_out_txs ADD COLUMN is_test_transaction BOOLEAN NOT NULL DEFAULT FALSE`,
    `ALTER TABLE cash_in_txs ADD COLUMN is_test_transaction BOOLEAN NOT NULL DEFAULT FALSE`,
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
