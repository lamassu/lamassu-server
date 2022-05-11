var db = require('./db')

exports.up = function (next) {
  var sql = [
    `CREATE TABLE custom_field_definitions (
      id UUID PRIMARY KEY,
      label TEXT NOT NULL UNIQUE,
      active BOOLEAN DEFAULT true
    )`,
    `CREATE TABLE customer_custom_field_pairs (
      customer_id UUID REFERENCES customers(id) NOT NULL,
      custom_field_id UUID REFERENCES custom_field_definitions(id) NOT NULL,
      value TEXT NOT NULL,
      UNIQUE (customer_id, custom_field_id)
    )`,
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
