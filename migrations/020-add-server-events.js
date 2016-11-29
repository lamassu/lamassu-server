var db = require('./db')

exports.up = function (next) {
  var sql = [
    `create table server_events (
      id serial PRIMARY KEY,
      event_type text NOT NULL,
      created timestamptz NOT NULL default now()
    )`,
    'CREATE INDEX ON server_events (created)'
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
