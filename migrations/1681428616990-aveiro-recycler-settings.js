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
    `CREATE TYPE cash_unit AS ENUM (
      'cashbox',
      'cassette1',
      'cassette2',
      'cassette3',
      'cassette4',
      'stacker1f',
      'stacker1r',
      'stacker2f',
      'stacker2r',
      'stacker3f',
      'stacker3r'
    )`,
    `ALTER TABLE bills ADD COLUMN destination_unit cash_unit NOT NULL DEFAULT 'cashbox'`,
    `CREATE TYPE cash_unit_operation_type AS ENUM(
      'cash-box-empty',
      'cash-box-refill',
      'cash-cassette-1-refill',
      'cash-cassette-1-empty',
      'cash-cassette-1-count-change',
      'cash-cassette-2-refill',
      'cash-cassette-2-empty',
      'cash-cassette-2-count-change',
      'cash-cassette-3-refill',
      'cash-cassette-3-empty',
      'cash-cassette-3-count-change',
      'cash-cassette-4-refill',
      'cash-cassette-4-empty',
      'cash-cassette-4-count-change',
      'cash-stacker-1f-refill',
      'cash-stacker-1f-empty',
      'cash-stacker-1f-count-change',
      'cash-stacker-1r-refill',
      'cash-stacker-1r-empty',
      'cash-stacker-1r-count-change',
      'cash-stacker-2f-refill',
      'cash-stacker-2f-empty',
      'cash-stacker-2f-count-change',
      'cash-stacker-2r-refill',
      'cash-stacker-2r-empty',
      'cash-stacker-2r-count-change',
      'cash-stacker-3f-refill',
      'cash-stacker-3f-empty',
      'cash-stacker-3f-count-change',
      'cash-stacker-3r-refill',
      'cash-stacker-3r-empty',
      'cash-stacker-3r-count-change'
    )`,
    `ALTER TABLE cashbox_batches ALTER COLUMN operation_type TYPE cash_unit_operation_type USING operation_type::text::cash_unit_operation_type`,
    `ALTER TABLE cashbox_batches RENAME TO cash_unit_operation`,
    `DROP TYPE cashbox_batch_type`,
    `CREATE TABLE empty_unit_bills (
      id UUID PRIMARY KEY,
      fiat INTEGER NOT NULL,
      fiat_code TEXT NOT NULL,
      created TIMESTAMPTZ NOT NULL DEFAULT now(),
      device_id TEXT REFERENCES devices (device_id),
      cashbox_batch_id UUID REFERENCES cash_unit_operation (id)
    )`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
