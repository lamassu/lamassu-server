var db = require('./db')

exports.up = function (next) {
  var sql = [
    `ALTER TABLE blacklist DROP CONSTRAINT blacklist_crypto_code_address_key`,
    `ALTER TABLE blacklist ADD CONSTRAINT blacklist_crypto_code_address_created_by_operator_key UNIQUE (crypto_code, address, created_by_operator)`,
    `CREATE INDEX ON blacklist (created_by_operator)`,
    `REINDEX TABLE blacklist`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
