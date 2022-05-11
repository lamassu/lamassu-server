var db = require('./db')

exports.up = function (next) {
  var sql = [
    'alter table cash_in_txs alter column cash_in_fee_crypto type numeric(30)',
    'alter table cash_in_txs alter column crypto_atoms type numeric(30)',
    'alter table cash_out_txs alter column crypto_atoms type numeric(30)',
    'alter table trades alter column crypto_atoms type numeric(30)',
    'alter table bills alter column crypto_atoms type numeric(30)',
    'alter table bills alter column cash_in_fee_crypto type numeric(30)',
    'alter table bills alter column crypto_atoms_after_fee type numeric(30)'
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
