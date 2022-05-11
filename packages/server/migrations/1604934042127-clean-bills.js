const db = require('./db')

exports.up = function (next) {
  var sql = [
    'ALTER TABLE bills DROP COLUMN crypto_atoms',
    'ALTER TABLE bills DROP COLUMN cash_in_fee_crypto',
    'ALTER TABLE bills DROP COLUMN crypto_atoms_after_fee'
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
