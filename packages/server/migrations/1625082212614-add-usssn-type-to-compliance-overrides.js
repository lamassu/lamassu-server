const db = require('./db')

exports.up = function (next) {
  const sql = [
    `ALTER TYPE compliance_type ADD VALUE 'us_ssn'`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
