var db = require('./db')

exports.up = function (next) {
  var sql = [
    `create table if not exists cash_out_actions (
      id serial primary key,
      tx_id uuid not null,
      action text not null,
      to_address text,
      error text,
      error_code text,
      tx_hash text,
      provisioned_1 integer,
      provisioned_2 integer,
      dispensed_1 integer,
      dispensed_2 integer,
      rejected_1 integer,
      rejected_2 integer,
      denomination_1 integer,
      denomination_2 integer,
      redeem boolean not null default false,
      device_time bigint,
      created timestamptz not null default now()
    )`,
    db.dropColumn('cash_out_txs', 'dispensed_1'),
    db.dropColumn('cash_out_txs', 'dispensed_2'),
    db.dropColumn('cash_out_txs', 'rejected_1'),
    db.dropColumn('cash_out_txs', 'rejected_2'),
    db.dropColumn('cash_out_txs', 'denomination_1'),
    db.dropColumn('cash_out_txs', 'denomination_2'),
    db.dropColumn('cash_out_txs', 'dispense_error'),
    db.dropColumn('cash_out_txs', 'dispense_time'),
    db.addColumn('cash_out_txs', 'dispense_confirmed', 'boolean default false'),
    db.renameColumn('cash_out_txs', 'dispensed', 'dispense')
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
