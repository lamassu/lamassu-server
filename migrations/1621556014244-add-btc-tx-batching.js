var db = require('./db')

exports.up = function (next) {
  var sql = [
    `CREATE TYPE transaction_batch_status AS ENUM('open', 'ready', 'failed', 'sent')`,
    `CREATE TABLE transaction_batches (
      id UUID PRIMARY KEY,
      crypto_code TEXT NOT NULL,
      status transaction_batch_status NOT NULL DEFAULT 'open',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      closed_at TIMESTAMPTZ,
      error_message TEXT
    )`,
    `ALTER TABLE cash_in_txs ADD COLUMN batch_id UUID REFERENCES transaction_batches(id)`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
