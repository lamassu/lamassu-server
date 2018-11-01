var db = require('./db')

exports.up = function (next) {
  var sql = [
    db.addColumn('cash_in_txs', 'send_confirmed', 'boolean not null default false'),
    db.addColumn('cash_in_txs', 'device_time', 'bigint not null'),
    db.addColumn('cash_in_txs', 'timedout', 'boolean not null default false'),
    db.addColumn('cash_in_txs', 'send_time', 'timestamptz'),
    db.addColumn('cash_in_txs', 'error_code', 'text'),
    db.addColumn('cash_in_txs', 'operator_completed', 'boolean not null default false'),
    db.addColumn('cash_in_txs', 'send_pending', 'boolean not null default false'),
    db.addColumn('cash_out_txs', 'device_time', 'bigint not null'),
    db.addColumn('cash_out_txs', 'timedout', 'boolean not null default false')
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
