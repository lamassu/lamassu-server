const db = require('./db')

exports.up = function (next) {
  const sql = [
    'ALTER TABLE cash_in_txs ADD COLUMN tx_customer_photo_at timestamptz, ADD COLUMN tx_customer_photo_path text',
    'ALTER TABLE cash_out_txs ADD COLUMN tx_customer_photo_at timestamptz, ADD COLUMN tx_customer_photo_path text'
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
