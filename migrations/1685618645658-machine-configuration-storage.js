const db = require('./db')

exports.up = function (next) {
  var sql = [
    // Using JSON instead of JSONB to preserve key order
    `CREATE TABLE device_configuration (
      device_id TEXT PRIMARY KEY REFERENCES devices(device_id),
      device_config JSON NOT NULL,
      last_modified TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
