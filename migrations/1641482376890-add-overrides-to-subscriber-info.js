var db = require('./db')

exports.up = function (next) {
  var sql = [
    `ALTER TABLE customers 
     ADD COLUMN phone_override VERIFICATION_TYPE NOT NULL DEFAULT 'automatic',
     ADD COLUMN phone_override_by UUID,
     ADD COLUMN phone_override_at TIMESTAMPTZ
    `,
    `ALTER TABLE edited_customer_data
     ADD COLUMN phone TEXT,
     ADD COLUMN phone_at TIMESTAMPTZ,
     ADD COLUMN phone_by UUID
    `
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
