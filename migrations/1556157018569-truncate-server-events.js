const db = require('./db')

exports.up = function (next) {
  var sql = [
    'TRUNCATE TABLE server_events'
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
