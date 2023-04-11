var db = require('./db')

exports.up = function (next) {
  var sql = [
    `ALTER TABLE customers ADD COLUMN applicant_id TEXT`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
