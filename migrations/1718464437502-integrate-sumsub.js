const db = require('./db')

exports.up = function (next) {
  let sql = [
    `CREATE TYPE EXTERNAL_COMPLIANCE_STATUS AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'RETRY')`,
    `CREATE TABLE CUSTOMER_EXTERNAL_COMPLIANCE (
      customer_id UUID NOT NULL REFERENCES customers(id),
      service TEXT NOT NULL,
      external_id TEXT NOT NULL,
      last_known_status EXTERNAL_COMPLIANCE_STATUS,
      last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (customer_id, service) 
    )`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
