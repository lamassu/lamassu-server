const db = require('./db')

exports.up = function (next) {
  var sql = [
    `ALTER TABLE cash_out_actions 
      ADD COLUMN provisioned_1f INTEGER,
      ADD COLUMN provisioned_1r INTEGER,
      ADD COLUMN provisioned_2f INTEGER,
      ADD COLUMN provisioned_2r INTEGER,
      ADD COLUMN provisioned_3f INTEGER,
      ADD COLUMN provisioned_3r INTEGER,
      ADD COLUMN dispensed_1f INTEGER,
      ADD COLUMN dispensed_1r INTEGER,
      ADD COLUMN dispensed_2f INTEGER,
      ADD COLUMN dispensed_2r INTEGER,
      ADD COLUMN dispensed_3f INTEGER,
      ADD COLUMN dispensed_3r INTEGER,
      ADD COLUMN rejected_1f INTEGER,
      ADD COLUMN rejected_1r INTEGER,
      ADD COLUMN rejected_2f INTEGER,
      ADD COLUMN rejected_2r INTEGER,
      ADD COLUMN rejected_3f INTEGER,
      ADD COLUMN rejected_3r INTEGER,
      ADD COLUMN denomination_1f INTEGER,
      ADD COLUMN denomination_1r INTEGER,
      ADD COLUMN denomination_2f INTEGER,
      ADD COLUMN denomination_2r INTEGER,
      ADD COLUMN denomination_3f INTEGER,
      ADD COLUMN denomination_3r INTEGER`,
    `ALTER TABLE devices 
      ADD COLUMN stacker1f INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN stacker1r INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN stacker2f INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN stacker2r INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN stacker3f INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN stacker3r INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN number_of_stackers INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE cash_out_txs 
      ADD COLUMN provisioned_1f INTEGER,
      ADD COLUMN provisioned_1r INTEGER,
      ADD COLUMN provisioned_2f INTEGER,
      ADD COLUMN provisioned_2r INTEGER,
      ADD COLUMN provisioned_3f INTEGER,
      ADD COLUMN provisioned_3r INTEGER,
      ADD COLUMN denomination_1f INTEGER,
      ADD COLUMN denomination_1r INTEGER,
      ADD COLUMN denomination_2f INTEGER,
      ADD COLUMN denomination_2r INTEGER,
      ADD COLUMN denomination_3f INTEGER,
      ADD COLUMN denomination_3r INTEGER`,
    `CREATE TYPE bill_destination_unit AS ENUM ('cashbox', 'stacker1f', 'stacker1r', 'stacker2f', 'stacker2r', 'stacker3f', 'stacker3r')`,
    `ALTER TABLE bills ADD COLUMN destination_unit bill_destination_unit NOT NULL DEFAULT 'cashbox'`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
