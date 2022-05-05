var db = require('./db')

exports.up = function (next) {
  var sql = [
    'alter table devices drop authorized',
    'alter table devices drop unpair',
    `create table paired_devices (
      device_id text PRIMARY KEY,
      created timestamptz NOT NULL default now()
    )`
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
