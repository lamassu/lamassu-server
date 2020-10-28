const db = require('./db')

exports.up = function (next) {
  var sql = [
    'alter table trades add column tx_in_id uuid unique',
    'alter table trades add constraint fk_tx_in foreign key (tx_in_id) references cash_in_txs (id)',
    'alter table trades add column tx_out_id uuid unique',
    'alter table trades add constraint fk_tx_out foreign key (tx_in_id) references cash_out_txs (id)'
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
