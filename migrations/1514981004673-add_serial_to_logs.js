const db = require('./db')

exports.up = function (next) {
  const sql = [
    db.addColumn('logs', 'serial', 'integer not null default 0')
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
