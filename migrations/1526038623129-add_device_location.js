var db = require('./db')

exports.up = function (next) {
  var sql = [
    'alter table devices add column last_online timestamptz not null default now()',
    "alter table devices add column location json not null default '{}'"
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
