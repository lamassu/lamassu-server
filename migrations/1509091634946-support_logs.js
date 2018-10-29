var db = require('./db')

exports.up = function (next) {
  const sql =
    [`create table if not exists support_logs (
    id uuid PRIMARY KEY,
    device_id text,
    timestamp timestamptz not null default now() )`,
    db.addColumn('logs', 'server_timestamp', 'timestamptz not null default now()')
    ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
