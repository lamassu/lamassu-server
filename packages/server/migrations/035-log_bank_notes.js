var db = require('./db')

exports.up = function (next) {
  var sql = [
    `create table cash_out_refills (
    id uuid PRIMARY KEY,
    device_id text not null,
    user_id integer not null,
    cassette1 integer not null,
    cassette2 integer not null,
    denomination1 integer not null,
    denomination2 integer not null,
    created timestamptz not null default now())`,
    `create table cash_in_refills (
    id uuid PRIMARY KEY,
    device_id text not null,
    user_id integer not null,
    cash_box_count integer not null,
    created timestamptz not null default now())`
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
