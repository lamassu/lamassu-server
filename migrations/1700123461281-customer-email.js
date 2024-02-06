const db = require('./db')

exports.up = function (next) {
  let sql = [
    'ALTER TABLE customers ADD COLUMN email text unique',
    'ALTER TABLE customers ADD COLUMN email_at timestamptz',
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
