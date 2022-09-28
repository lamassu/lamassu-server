var db = require('./db')

exports.up = function (next) {
  var sql = [
    `ALTER TABLE devices ADD COLUMN is_enabled BOOLEAN DEFAULT true`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
