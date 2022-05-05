const db = require('./db')

exports.up = function (next) {
  const sql = [
    `CREATE TABLE custom_info_requests(
      id UUID PRIMARY KEY,
      enabled BOOLEAN NOT NULL DEFAULT true,
      custom_request JSONB
    );
    CREATE TABLE customers_custom_info_requests(
      customer_id UUID REFERENCES customers,
      info_request_id UUID REFERENCES custom_info_requests,
      approved BOOLEAN,
      customer_data JSONB NOT NULL,
      PRIMARY KEY(customer_id, info_request_id)
    );`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
