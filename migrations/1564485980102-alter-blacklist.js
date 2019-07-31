const db = require('./db')

exports.up = function (next) {
  var sql = [
    "ALTER TABLE blacklist ADD COLUMN created_by_operator boolean not null default 't' "
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
