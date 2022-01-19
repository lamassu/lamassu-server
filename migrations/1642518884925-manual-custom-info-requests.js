var db = require('./db')

exports.up = function (next) {
  var sql = [
    `ALTER TABLE customers_custom_info_requests DROP COLUMN approved`,
    `ALTER TABLE customers_custom_info_requests ADD COLUMN override verification_type NOT NULL DEFAULT 'automatic'`,
    `ALTER TABLE customers_custom_info_requests ADD COLUMN override_by UUID REFERENCES users(id)`,
    `ALTER TABLE customers_custom_info_requests ADD COLUMN override_at TIMESTAMPTZ`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
