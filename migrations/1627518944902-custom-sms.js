var db = require('./db')

exports.up = function (next) {
  var sql = [
    `CREATE TYPE custom_message_event AS ENUM('sms_code', 'cash_out_dispense_ready')`,
    `CREATE TABLE custom_messages (
      id UUID PRIMARY KEY,
      event custom_message_event NOT NULL,
      device_id TEXT REFERENCES devices(device_id),
      message TEXT NOT NULL,
      created TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
    `CREATE UNIQUE INDEX uq_custom_message_per_device ON custom_messages (event, device_id) WHERE device_id IS NOT NULL`,
    `CREATE UNIQUE INDEX uq_custom_message_all_devices ON custom_messages (event) WHERE device_id IS NULL`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
