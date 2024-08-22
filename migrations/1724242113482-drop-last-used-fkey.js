const db = require('./db')

exports.up = function (next) {
  db.multi([
    'ALTER TABLE customers DROP CONSTRAINT customers_last_used_machine_fkey;',
    'ALTER TABLE machine_diagnostics DROP CONSTRAINT machine_diagnostics_device_id_fkey;'
  ], next)
}

exports.down = function (next) {
  next()
}
