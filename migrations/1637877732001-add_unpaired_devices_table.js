var db = require('./db')

exports.up = function (next) {
  var sql = [
    `ALTER TABLE cashbox_batches
    DROP CONSTRAINT cashbox_batches_device_id_fkey;`,
    `CREATE TABLE IF NOT EXISTS unpaired_devices (
      id uuid PRIMARY KEY,
      device_id text NOT NULL,
      model text,
      name text,
      paired timestamp NOT NULL,
      unpaired timestamp NOT NULL
    )`,
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
