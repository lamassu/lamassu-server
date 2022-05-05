const db = require('./db')

exports.up = function (next) {
  var sql = [
    'ALTER TABLE customers ADD COLUMN us_ssn text',
    'ALTER TABLE customers ADD COLUMN us_ssn_at timestamptz',
    "ALTER TABLE customers ADD COLUMN us_ssn_override verification_type not null default 'automatic'",
    'ALTER TABLE customers ADD COLUMN us_ssn_override_by text references user_tokens (token)',
    'ALTER TABLE customers ADD COLUMN us_ssn_override_at timestamptz',
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
