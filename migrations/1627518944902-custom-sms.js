var db = require('./db')

exports.up = function (next) {
  var sql = [
    `CREATE TYPE custom_message_event AS ENUM('sms_code', 'cash_out_dispense_ready')`,
    `CREATE TABLE custom_messages (
      id UUID PRIMARY KEY,
      event custom_message_event UNIQUE NOT NULL,
      message TEXT NOT NULL,
      created TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
