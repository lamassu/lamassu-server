var db = require('./db')

exports.up = function (next) {
  var sql = [
    'drop table if exists cached_responses',
    `create table idempotents (
      request_id text PRIMARY KEY,
      device_id text NOT NULL,
      body json NOT NULL,
      status integer NOT NULL,
      pending boolean NOT NULL,
      created timestamptz NOT NULL default now()
    )`
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
