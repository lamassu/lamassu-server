const db = require('./db')

exports.up = function (next) {
  var sql = [
    `
      ALTER TABLE cash_out_actions RENAME COLUMN provisioned_1f TO provisioned_recycler_1;
      ALTER TABLE cash_out_actions RENAME COLUMN provisioned_1r TO provisioned_recycler_2;
      ALTER TABLE cash_out_actions RENAME COLUMN provisioned_2f TO provisioned_recycler_3;
      ALTER TABLE cash_out_actions RENAME COLUMN provisioned_2r TO provisioned_recycler_4;
      ALTER TABLE cash_out_actions RENAME COLUMN provisioned_3f TO provisioned_recycler_5;
      ALTER TABLE cash_out_actions RENAME COLUMN provisioned_3r TO provisioned_recycler_6;
      ALTER TABLE cash_out_actions RENAME COLUMN dispensed_1f TO dispensed_recycler_1;
      ALTER TABLE cash_out_actions RENAME COLUMN dispensed_1r TO dispensed_recycler_2;
      ALTER TABLE cash_out_actions RENAME COLUMN dispensed_2f TO dispensed_recycler_3;
      ALTER TABLE cash_out_actions RENAME COLUMN dispensed_2r TO dispensed_recycler_4;
      ALTER TABLE cash_out_actions RENAME COLUMN dispensed_3f TO dispensed_recycler_5;
      ALTER TABLE cash_out_actions RENAME COLUMN dispensed_3r TO dispensed_recycler_6;
      ALTER TABLE cash_out_actions RENAME COLUMN rejected_1f TO rejected_recycler_1;
      ALTER TABLE cash_out_actions RENAME COLUMN rejected_1r TO rejected_recycler_2;
      ALTER TABLE cash_out_actions RENAME COLUMN rejected_2f TO rejected_recycler_3;
      ALTER TABLE cash_out_actions RENAME COLUMN rejected_2r TO rejected_recycler_4;
      ALTER TABLE cash_out_actions RENAME COLUMN rejected_3f TO rejected_recycler_5;
      ALTER TABLE cash_out_actions RENAME COLUMN rejected_3r TO rejected_recycler_6;
      ALTER TABLE cash_out_actions RENAME COLUMN denomination_1f TO denomination_recycler_1;
      ALTER TABLE cash_out_actions RENAME COLUMN denomination_1r TO denomination_recycler_2;
      ALTER TABLE cash_out_actions RENAME COLUMN denomination_2f TO denomination_recycler_3;
      ALTER TABLE cash_out_actions RENAME COLUMN denomination_2r TO denomination_recycler_4;
      ALTER TABLE cash_out_actions RENAME COLUMN denomination_3f TO denomination_recycler_5;
      ALTER TABLE cash_out_actions RENAME COLUMN denomination_3r TO denomination_recycler_6;
    `,
    `
      ALTER TABLE devices RENAME COLUMN stacker1f TO recycler1;
      ALTER TABLE devices RENAME COLUMN stacker1r TO recycler2;
      ALTER TABLE devices RENAME COLUMN stacker2f TO recycler3;
      ALTER TABLE devices RENAME COLUMN stacker2r TO recycler4;
      ALTER TABLE devices RENAME COLUMN stacker3f TO recycler5;
      ALTER TABLE devices RENAME COLUMN stacker3r TO recycler6;
      ALTER TABLE devices RENAME COLUMN number_of_stackers TO number_of_recyclers;
    `,
    `
      ALTER TABLE cash_out_txs RENAME COLUMN provisioned_1f TO provisioned_recycler_1;
      ALTER TABLE cash_out_txs RENAME COLUMN provisioned_1r TO provisioned_recycler_2;
      ALTER TABLE cash_out_txs RENAME COLUMN provisioned_2f TO provisioned_recycler_3;
      ALTER TABLE cash_out_txs RENAME COLUMN provisioned_2r TO provisioned_recycler_4;
      ALTER TABLE cash_out_txs RENAME COLUMN provisioned_3f TO provisioned_recycler_5;
      ALTER TABLE cash_out_txs RENAME COLUMN provisioned_3r TO provisioned_recycler_6;
      ALTER TABLE cash_out_txs RENAME COLUMN denomination_1f TO denomination_recycler_1;
      ALTER TABLE cash_out_txs RENAME COLUMN denomination_1r TO denomination_recycler_2;
      ALTER TABLE cash_out_txs RENAME COLUMN denomination_2f TO denomination_recycler_3;
      ALTER TABLE cash_out_txs RENAME COLUMN denomination_2r TO denomination_recycler_4;
      ALTER TABLE cash_out_txs RENAME COLUMN denomination_3f TO denomination_recycler_5;
      ALTER TABLE cash_out_txs RENAME COLUMN denomination_3r TO denomination_recycler_6;
    `,
    `
      ALTER TYPE cash_unit RENAME VALUE 'stacker1f' TO 'recycler1';
      ALTER TYPE cash_unit RENAME VALUE 'stacker1r' TO 'recycler2';
      ALTER TYPE cash_unit RENAME VALUE 'stacker2f' TO 'recycler3';
      ALTER TYPE cash_unit RENAME VALUE 'stacker2r' TO 'recycler4';
      ALTER TYPE cash_unit RENAME VALUE 'stacker3f' TO 'recycler5';
      ALTER TYPE cash_unit RENAME VALUE 'stacker3r' TO 'recycler6';
    `,
    `
      ALTER TYPE cash_unit_operation_type RENAME VALUE 'cash-stacker-1f-refill' TO 'cash-recycler-1-refill';
      ALTER TYPE cash_unit_operation_type RENAME VALUE 'cash-stacker-1f-empty' TO 'cash-recycler-1-empty';
      ALTER TYPE cash_unit_operation_type RENAME VALUE 'cash-stacker-1f-count-change' TO 'cash-recycler-1-count-change';
      ALTER TYPE cash_unit_operation_type RENAME VALUE 'cash-stacker-1r-refill' TO 'cash-recycler-2-refill';
      ALTER TYPE cash_unit_operation_type RENAME VALUE 'cash-stacker-1r-empty' TO 'cash-recycler-2-empty';
      ALTER TYPE cash_unit_operation_type RENAME VALUE 'cash-stacker-1r-count-change' TO 'cash-recycler-2-count-change';
      ALTER TYPE cash_unit_operation_type RENAME VALUE 'cash-stacker-2f-refill' TO 'cash-recycler-3-refill';
      ALTER TYPE cash_unit_operation_type RENAME VALUE 'cash-stacker-2f-empty' TO 'cash-recycler-3-empty';
      ALTER TYPE cash_unit_operation_type RENAME VALUE 'cash-stacker-2f-count-change' TO 'cash-recycler-3-count-change';
      ALTER TYPE cash_unit_operation_type RENAME VALUE 'cash-stacker-2r-refill' TO 'cash-recycler-4-refill';
      ALTER TYPE cash_unit_operation_type RENAME VALUE 'cash-stacker-2r-empty' TO 'cash-recycler-4-empty';
      ALTER TYPE cash_unit_operation_type RENAME VALUE 'cash-stacker-2r-count-change' TO 'cash-recycler-4-count-change';
      ALTER TYPE cash_unit_operation_type RENAME VALUE 'cash-stacker-3f-refill' TO 'cash-recycler-5-refill';
      ALTER TYPE cash_unit_operation_type RENAME VALUE 'cash-stacker-3f-empty' TO 'cash-recycler-5-empty';
      ALTER TYPE cash_unit_operation_type RENAME VALUE 'cash-stacker-3f-count-change' TO 'cash-recycler-5-count-change';
      ALTER TYPE cash_unit_operation_type RENAME VALUE 'cash-stacker-3r-refill' TO 'cash-recycler-6-refill';
      ALTER TYPE cash_unit_operation_type RENAME VALUE 'cash-stacker-3r-empty' TO 'cash-recycler-6-empty';
      ALTER TYPE cash_unit_operation_type RENAME VALUE 'cash-stacker-3r-count-change' TO 'cash-recycler-6-count-change';
    `,
    `UPDATE devices SET number_of_recyclers = number_of_recyclers * 2;`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
