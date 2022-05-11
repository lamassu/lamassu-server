var db = require('./db')

exports.up = function (next) {
  const sql =
    [`create table sanctions_logs (
    id uuid PRIMARY KEY,
    device_id text not null,
    sanctioned_id text not null,
    sanctioned_alias_id text,
    sanctioned_alias_full_name text not null,
    customer_id uuid not null references customers,
    created timestamptz not null default now() )`
    ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
