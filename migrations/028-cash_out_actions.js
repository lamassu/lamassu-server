var db = require('./db')

exports.up = function (next) {
  var sql = [
    `create table cash_out_actions (
      id serial primary key,
      tx_id uuid references cash_out_txs not null,
      action text not null,
      to_address text,
      error text,
      error_code text,
      tx_hash text,
      success boolean not null,
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
    'alter table cash_out_txs drop column dispensed_1',
    'alter table cash_out_txs drop column dispensed_2',
    'alter table cash_out_txs drop column rejected_1',
    'alter table cash_out_txs drop column rejected_2',
    'alter table cash_out_txs drop column denomination_1',
    'alter table cash_out_txs drop column denomination_2',
    'alter table cash_out_txs drop column dispense_error',
    'alter table cash_out_txs add column dispense_confirmed boolean default false'
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
