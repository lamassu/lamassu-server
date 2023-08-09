const db = require('./db')

exports.up = function (next) {
  var sql = [
    'ALTER TABLE empty_unit_bills ALTER COLUMN device_id TYPE TEXT, ALTER COLUMN device_id SET NOT NULL',
    'ALTER TABLE empty_unit_bills DROP CONSTRAINT empty_unit_bills_device_id_fkey',
    'ALTER TABLE devices DROP COLUMN cashbox',
    'CREATE INDEX ON empty_unit_bills (cashbox_batch_id)',
    'CREATE INDEX ON bills (cashbox_batch_id)',
    'CREATE INDEX ON bills (destination_unit)',
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
