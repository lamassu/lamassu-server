var db = require('./db')

exports.up = function (next) {
  const sql =
    [
      'create table server_logs ( ' +
      'id uuid PRIMARY KEY, ' +
      'device_id text, ' +
      'log_level text, ' +
      'timestamp timestamptz DEFAULT now(), ' +
      'message text, ' +
      'meta json)',

      `create table server_support_logs (
      id uuid PRIMARY KEY,
      timestamp timestamptz not null default now() )`
    ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
