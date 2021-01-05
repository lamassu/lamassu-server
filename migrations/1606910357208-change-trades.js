const db = require('./db')

exports.up = function (next) {
  var sql = [
    'ALTER TABLE trades ADD COLUMN tx_in_id UUID UNIQUE',
    'ALTER TABLE trades ADD CONSTRAINT fk_tx_in FOREIGN KEY (tx_in_id) REFERENCES cash_in_txs (id)',
    'ALTER TABLE trades ADD COLUMN tx_out_id UUID UNIQUE',
    'ALTER TABLE trades ADD CONSTRAINT fk_tx_out FOREIGN KEY (tx_in_id) REFERENCES cash_out_txs (id)'
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
