const db = require('./db')

exports.up = function (next) {
  const sql = [
    'ALTER TABLE cash_in_txs ADD COLUMN tx_customer_photo_at TIMESTAMPTZ, ADD COLUMN tx_customer_photo_path TEXT',
    'ALTER TABLE cash_out_txs ADD COLUMN tx_customer_photo_at TIMESTAMPTZ, ADD COLUMN tx_customer_photo_path TEXT'
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
