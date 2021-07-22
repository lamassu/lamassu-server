var db = require('./db')

exports.up = function (next) {
  var sql = [
    `CREATE TYPE individual_discount_identification_type AS ENUM('phone', 'id_number')`,
    `CREATE TABLE individual_discounts (
      id UUID PRIMARY KEY,
      identification individual_discount_identification_type NOT NULL,
      value TEXT NOT NULL,
      discount SMALLINT NOT NULL,
      soft_deleted BOOLEAN DEFAULT false
    )`,
    `CREATE UNIQUE INDEX uq_individual_discount ON individual_discounts (identification, value) WHERE NOT soft_deleted`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
