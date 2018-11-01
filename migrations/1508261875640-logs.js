var db = require('./db')

exports.up = function (next) {
  const sql =
    [`create table if not exists logs (
    id uuid PRIMARY KEY,
    device_id text,
    log_level text,
    timestamp timestamptz,
    message text)`
    ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
