const db = require('./db')

exports.up = next => db.multi([
  'ALTER TABLE cash_out_txs ADD COLUMN fixed_fee numeric(14, 5) NOT NULL DEFAULT 0;',
  'ALTER TABLE cash_out_txs ADD COLUMN fixed_fee_crypto numeric(30) NOT NULL DEFAULT 0;',
], next)

exports.down = next => next()
