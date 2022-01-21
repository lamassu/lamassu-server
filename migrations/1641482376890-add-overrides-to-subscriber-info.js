var db = require('./db')

exports.up = function (next) {
  var sql = [
    `ALTER TABLE customers 
     ADD COLUMN phone_override VERIFICATION_TYPE NOT NULL DEFAULT 'automatic',
     ADD COLUMN phone_override_by UUID,
     ADD COLUMN phone_override_at TIMESTAMPTZ
    `
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
