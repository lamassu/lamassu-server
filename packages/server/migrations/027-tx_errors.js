var db = require('./db')

exports.up = function (next) {
  var sql = [
    `create table cash_in_actions (
      id serial primary key,
      tx_id uuid not null,
      action text not null,
      error text,
      error_code text,
      tx_hash text,
      created timestamptz not null default now()
    )`
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
