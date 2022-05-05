var db = require('./db')

exports.up = function (next) {
  var sql = [
    'drop table if exists devices',
    'drop table if exists paired_devices',
    `create table devices (
      device_id text PRIMARY KEY,
      name text NOT NULL,
      cashbox integer NOT NULL default 0,
      cassette1 integer NOT NULL default 0,
      cassette2 integer NOT NULL default 0,
      paired boolean NOT NULL default TRUE,
      display boolean NOT NULL default TRUE,
      created timestamptz NOT NULL default now()
    )`,
    'alter table pairing_tokens add column name text NOT NULL'
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
