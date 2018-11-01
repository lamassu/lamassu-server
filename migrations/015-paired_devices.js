var db = require('./db')

exports.up = function (next) {
  var sql = [
    db.dropColumn('devices', 'authorized'),
    db.dropColumn('devices', 'unpair'),
    `CREATE TABLE IF NOT EXISTS paired_devices (
      device_id text PRIMARY KEY,
      created timestamptz NOT NULL default now()
    )`
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
