var db = require('./db')

exports.up = function (next) {
  var sql = [
    db.addColumn('cash_out_txs', 'dispensed_1', 'integer'),
    db.addColumn('cash_out_txs', 'dispensed_2', 'integer'),
    db.addColumn('cash_out_txs', 'rejected_1', 'integer'),
    db.addColumn('cash_out_txs', 'rejected_2', 'integer'),
    db.addColumn('cash_out_txs', 'denomination_1', 'integer'),
    db.addColumn('cash_out_txs', 'denomination_2', 'integer'),
    db.addColumn('cash_out_txs', 'dispense_error', 'text'),
    db.addColumn('cash_out_txs', 'dispense_time', 'timestamptz'),
    'drop table if exists dispenses'
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
