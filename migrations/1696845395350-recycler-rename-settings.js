const db = require('./db')

exports.up = function (next) {
  var sql = [
    `ALTER TABLE cash_out_actions 
      RENAME COLUMN provisioned_1f TO provisioned_recycler_1,
      RENAME COLUMN provisioned_1r TO provisioned_recycler_2,
      RENAME COLUMN provisioned_2f TO provisioned_recycler_3,
      RENAME COLUMN provisioned_2r TO provisioned_recycler_4,
      RENAME COLUMN provisioned_3f TO provisioned_recycler_5,
      RENAME COLUMN provisioned_3r TO provisioned_recycler_6,
      RENAME COLUMN dispensed_1f TO dispensed_recycler_1,
      RENAME COLUMN dispensed_1r TO dispensed_recycler_2,
      RENAME COLUMN dispensed_2f TO dispensed_recycler_3,
      RENAME COLUMN dispensed_2r TO dispensed_recycler_4,
      RENAME COLUMN dispensed_3f TO dispensed_recycler_5,
      RENAME COLUMN dispensed_3r TO dispensed_recycler_6,
      RENAME COLUMN rejected_1f TO rejected_recycler_1,
      RENAME COLUMN rejected_1r TO rejected_recycler_2,
      RENAME COLUMN rejected_2f TO rejected_recycler_3,
      RENAME COLUMN rejected_2r TO rejected_recycler_4,
      RENAME COLUMN rejected_3f TO rejected_recycler_5,
      RENAME COLUMN rejected_3r TO rejected_recycler_6,
      RENAME COLUMN denomination_1f TO denomination_recycler_1,
      RENAME COLUMN denomination_1r TO denomination_recycler_2,
      RENAME COLUMN denomination_2f TO denomination_recycler_3,
      RENAME COLUMN denomination_2r TO denomination_recycler_4,
      RENAME COLUMN denomination_3f TO denomination_recycler_5,
      RENAME COLUMN denomination_3r TO denomination_recycler_6`,
    `ALTER TABLE devices 
      RENAME COLUMN stacker1f TO recycler1,
      RENAME COLUMN stacker1r TO recycler2,
      RENAME COLUMN stacker2f TO recycler3,
      RENAME COLUMN stacker2r TO recycler4,
      RENAME COLUMN stacker3f TO recycler5,
      RENAME COLUMN stacker3r TO recycler6,
      RENAME COLUMN number_of_stackers TO number_of_recyclers`,
    `ALTER TABLE cash_out_txs 
      RENAME COLUMN provisioned_1f TO provisioned_recycler_1,
      RENAME COLUMN provisioned_1r TO provisioned_recycler_2,
      RENAME COLUMN provisioned_2f TO provisioned_recycler_3,
      RENAME COLUMN provisioned_2r TO provisioned_recycler_4,
      RENAME COLUMN provisioned_3f TO provisioned_recycler_5,
      RENAME COLUMN provisioned_3r TO provisioned_recycler_6,
      RENAME COLUMN denomination_1f TO denomination_recycler_1,
      RENAME COLUMN denomination_1r TO denomination_recycler_2,
      RENAME COLUMN denomination_2f TO denomination_recycler_3,
      RENAME COLUMN denomination_2r TO denomination_recycler_4,
      RENAME COLUMN denomination_3f TO denomination_recycler_5,
      RENAME COLUMN denomination_3r TO denomination_recycler_6`,
    `ALTER TYPE cash_unit 
      RENAME VALUE 'stacker1f' TO 'recycler1',
      RENAME VALUE 'stacker1r' TO 'recycler2',
      RENAME VALUE 'stacker2f' TO 'recycler3',
      RENAME VALUE 'stacker2r' TO 'recycler4',
      RENAME VALUE 'stacker3f' TO 'recycler5',
      RENAME VALUE 'stacker3r' TO 'recycler6',
    `,
    `ALTER TYPE cash_unit_operation_type 
      RENAME VALUE 'cash-stacker-1f-refill' TO 'cash-recycler-1-refill',
      RENAME VALUE 'cash-stacker-1f-empty' TO 'cash-recycler-1-empty',
      RENAME VALUE 'cash-stacker-1f-count-change' TO 'cash-recycler-1-count-change',
      RENAME VALUE 'cash-stacker-1r-refill' TO 'cash-recycler-2-refill',
      RENAME VALUE 'cash-stacker-1r-empty' TO 'cash-recycler-2-empty',
      RENAME VALUE 'cash-stacker-1r-count-change' TO 'cash-recycler-2-count-change',
      RENAME VALUE 'cash-stacker-2f-refill' TO 'cash-recycler-3-refill',
      RENAME VALUE 'cash-stacker-2f-empty' TO 'cash-recycler-3-empty',
      RENAME VALUE 'cash-stacker-2f-count-change' TO 'cash-recycler-3-count-change',
      RENAME VALUE 'cash-stacker-2r-refill' TO 'cash-recycler-4-refill',
      RENAME VALUE 'cash-stacker-2r-empty' TO 'cash-recycler-4-empty',
      RENAME VALUE 'cash-stacker-2r-count-change' TO 'cash-recycler-4-count-change',
      RENAME VALUE 'cash-stacker-3f-refill' TO 'cash-recycler-5-refill',
      RENAME VALUE 'cash-stacker-3f-empty' TO 'cash-recycler-5-empty',
      RENAME VALUE 'cash-stacker-3f-count-change' TO 'cash-recycler-5-count-change',
      RENAME VALUE 'cash-stacker-3r-refill' TO 'cash-recycler-6-refill',
      RENAME VALUE 'cash-stacker-3r-empty' TO 'cash-recycler-6-empty',
      RENAME VALUE 'cash-stacker-3r-count-change' TO 'cash-recycler-6-count-change',
    `
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
