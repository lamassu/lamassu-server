var db = require('./db')

exports.up = function (next) {
  var sql = [
    `ALTER TABLE customers ADD COLUMN subscriber_info JSON`,
    `ALTER TABLE customers ADD COLUMN subscriber_info_at TIMESTAMPTZ`,
    `ALTER TABLE customers ADD COLUMN subscriber_info_by UUID REFERENCES users(id)`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
