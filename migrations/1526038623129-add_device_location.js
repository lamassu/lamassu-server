var db = require('./db')

exports.up = function (next) {
  var sql = [
    db.addColumn('devices', 'last_online', 'timestamptz not null default now()'),
    db.addColumn('devices', 'location', 'json not null default \'{}\'')
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
