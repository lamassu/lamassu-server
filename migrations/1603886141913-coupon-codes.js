var db = require('./db')

exports.up = function (next) {
  const sql =
    [
      `create table coupons (
        id uuid primary key,
        code text not null,
        discount smallint not null,
        soft_deleted boolean default false )`,
      `create unique index uq_code on coupons using btree(code) where not soft_deleted`
    ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
