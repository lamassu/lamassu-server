var db = require('./db')

exports.up = function (next) {
  function singleQuotify (item) { return '\'' + item + '\'' }

  const updateEvents = [
    'inProgress',
    'successful',
    'error'
  ].map(singleQuotify).join(',')

  var sqls = [
    `CREATE TYPE update_events AS ENUM ${'(' + updateEvents + ')'}`,
    `CREATE TABLE machine_updates (
      id UUID PRIMARY KEY,
      device_id TEXT NOT NULL REFERENCES devices(device_id),
      event update_events NOT NULL,
      new_version TEXT NOT NULL,
      previous_version TEXT NOT NULL,
      created TIMESTAMPTZ NOT NULL DEFAULT now(),
      device_time TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
  ]

  db.multi(sqls, next)
}

exports.down = function (next) {
  next()
}
