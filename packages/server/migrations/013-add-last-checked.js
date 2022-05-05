var db = require('./db')

exports.up = function (next) {
  var sql = [
    'alter table cash_out_hds add last_checked timestamptz not null default now()',
    'alter table cash_out_hds add confirmed boolean not null default false',
    'create index on cash_out_hds (confirmed, last_checked)'
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
