const db = require('./db')

exports.up = function (next) {
  let sql = [
    `UPDATE cash_out_txs SET error_code = 'walletScoringError' WHERE error_code = 'ciphertraceError'`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
