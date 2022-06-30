const db = require('./db')

exports.up = (next) => {
  const sql = [
    `CREATE TABLE IF NOT EXISTS wallet_indeces (
      crypto_code VARCHAR(10) NOT NULL,
      wallet_hash CHAR(32) NOT NULL,
      type VARCHAR(10) NOT NULL,
      index INTEGER DEFAULT 0,
      PRIMARY KEY(crypto_code, wallet_hash, type)
    );`
  ]

  db.multi(sql, next)
}

exports.down = (next) => next()
