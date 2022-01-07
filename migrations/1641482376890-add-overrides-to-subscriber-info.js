var db = require('./db')

exports.up = function (next) {
  var sql = [
    `ALTER TABLE customers 
     ADD COLUMN subscriber_info_override VERIFICATION_TYPE,
     ADD COLUMN subscriber_info_override_by UUID,
     ADD COLUMN subscriber_info_override_at TIMESTAMPTZ
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
