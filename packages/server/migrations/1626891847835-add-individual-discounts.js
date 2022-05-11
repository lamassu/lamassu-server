var db = require('./db')

exports.up = function (next) {
  var sql = [
    `CREATE TABLE individual_discounts (
      id UUID PRIMARY KEY,
      customer_id UUID NOT NULL REFERENCES customers(id),
      discount SMALLINT NOT NULL,
      soft_deleted BOOLEAN DEFAULT false
    )`,
    `CREATE UNIQUE INDEX uq_individual_discount ON individual_discounts (customer_id) WHERE NOT soft_deleted`,
    `CREATE TYPE discount_source AS ENUM('individualDiscount', 'promoCode')`,
    `ALTER TABLE cash_in_txs ADD COLUMN discount_source discount_source`,
    `ALTER TABLE cash_out_txs ADD COLUMN discount_source discount_source`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
