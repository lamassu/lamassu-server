const db = require('./db')

exports.up = function (next) {
  var sql = [
    `CREATE TABLE cashout_tx_trades (
      tx_id uuid REFERENCES cash_out_txs(id),
      trade_id serial REFERENCES trades(id),
      CONSTRAINT cashout_trade_pkey PRIMARY KEY (tx_id,trade_id)
    )`,
    `CREATE TABLE cashin_tx_trades (
      tx_id uuid REFERENCES cash_in_txs(id),
      trade_id serial REFERENCES trades(id),
      CONSTRAINT cashin_trade_pkey PRIMARY KEY (tx_id,trade_id)
    )`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
