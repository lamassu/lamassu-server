var db = require('./db')

exports.up = function (next) {
  var sql = [
    `CREATE TABLE machine_locations (
      id UUID PRIMARY KEY,
      label TEXT NOT NULL,
      address_line_1 TEXT NOT NULL,
      address_line_2 TEXT,
      zip_code TEXT NOT NULL,
      country TEXT NOT NULL,
      created TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
    `ALTER TABLE devices ADD COLUMN machine_location UUID REFERENCES machine_locations(id)`,
    `ALTER TABLE pairing_tokens ADD COLUMN machine_location UUID REFERENCES machine_locations(id)`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
