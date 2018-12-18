var db = require('./db')

exports.up = function (next) {
  db.multi(['CREATE TABLE IF NOT EXISTS cashbox_sessions ( ' +
  'id uuid PRIMARY KEY, ' +
  'device_id text NOT NULL, ' +
  'device_time bigint NOT NULL, ' +
  'created timestamp NOT NULL DEFAULT now() )'], next)
}

exports.down = function (next) {
  next()
}
