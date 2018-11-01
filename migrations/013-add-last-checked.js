var db = require('./db')

exports.up = function (next) {
  var sql = [
    db.addColumn('cash_out_hds', 'last_checked', 'timestamptz not null default now()'),
    db.addColumn('cash_out_hds', 'confirmed', 'boolean not null default false'),
    'create index on cash_out_hds (confirmed, last_checked)'
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
