const db = require('./db')

exports.up = next => {
  const sql = [
    `CREATE TABLE IF NOT EXISTS wallet_consumed_indices (
      crypto_code VARCHAR(10) NOT NULL,
      wallet_hash CHAR(32) NOT NULL,
      type VARCHAR(10) NOT NULL,
      index INTEGER NOT NULL,
      last_check TIMESTAMP NOT NULL DEFAULT NOW(),
      PRIMARY KEY(crypto_code, wallet_hash, type, index)
    );`
  ]

  db.multi(sql, next)
}

exports.down = next => next()
