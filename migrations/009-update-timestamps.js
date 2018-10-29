var db = require('./db')

exports.up = function (next) {
  var sql = [
    db.alterColumn('transactions', 'created', 'type timestamptz'),
    db.alterColumn('bills', 'created', 'type timestamptz'),
    db.alterColumn('dispenses', 'created', 'type timestamptz'),
    db.alterColumn('machine_events', 'created', 'type timestamptz'),
    db.alterColumn('pairing_tokens', 'created', 'type timestamptz'),
    db.alterColumn('pending_transactions', 'updated', 'type timestamptz')
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
