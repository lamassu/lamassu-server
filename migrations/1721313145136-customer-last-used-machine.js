const db = require('./db')

exports.up = function (next) {
  db.multi(['ALTER TABLE customers ADD COLUMN last_used_machine TEXT REFERENCES devices (device_id)'], next)
}

exports.down = function (next) {
  next()
}
