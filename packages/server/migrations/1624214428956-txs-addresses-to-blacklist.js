var db = require('./db')

exports.up = function (next) {
  var sql = [
    `DELETE FROM blacklist WHERE created_by_operator = FALSE`,
    `ALTER TABLE blacklist DROP CONSTRAINT blacklist_crypto_code_address_created_by_operator_key`,
    `ALTER TABLE blacklist ADD CONSTRAINT blacklist_crypto_code_address_key UNIQUE (crypto_code, address)`,
    `DROP INDEX blacklist_created_by_operator_idx`,
    `ALTER TABLE blacklist DROP COLUMN created_by_operator`,
    `CREATE INDEX cash_in_txs_to_address_idx ON cash_in_txs(to_address)`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
