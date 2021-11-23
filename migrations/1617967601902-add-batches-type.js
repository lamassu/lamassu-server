var db = require('./db')

exports.up = function (next) {
  var sqls = [
    `CREATE TYPE cashbox_batch_type AS ENUM(
      'cash-in-empty',
      'cash-out-1-refill',
      'cash-out-1-empty',
      'cash-out-2-refill',
      'cash-out-2-empty',
      'cash-out-3-refill',
      'cash-out-3-empty',
      'cash-out-4-refill',
      'cash-out-4-empty'
    )`,
    `ALTER TABLE cashbox_batches ADD COLUMN operation_type cashbox_batch_type NOT NULL`,
    `ALTER TABLE cashbox_batches ADD COLUMN bill_count_override SMALLINT`,
    `ALTER TABLE cashbox_batches ADD COLUMN performed_by VARCHAR(64)`
  ]
  db.multi(sqls, next)
}

exports.down = function (next) {
  next()
}
