const db = require('./db')

exports.up = function (next) {
  let sql = [
    'ALTER TABLE customers ADD COLUMN last_auth_attempt timestamptz'
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
