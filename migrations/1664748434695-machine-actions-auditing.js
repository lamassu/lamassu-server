var db = require('./db')

exports.up = function (next) {
  var sql = [
    `CREATE TYPE machine_action AS ENUM (
      'rename',
      'empty-cash-in-bills',
      'reset-cash-out-bills',
      'set-cassette-bills',
      'unpair',
      'reboot',
      'shutdown',
      'restart-services',
      'edit-location',
      'delete-location',
      'create-location',
      'disable',
      'enable'
    )`,
    `CREATE TABLE machine_action_logs (
      id UUID PRIMARY KEY,
      device_id TEXT NOT NULL REFERENCES devices(device_id),
      action machine_action NOT NULL,
      values JSONB NOT NULL,
      performed_by UUID NOT NULL REFERENCES users(id),
      performed_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
