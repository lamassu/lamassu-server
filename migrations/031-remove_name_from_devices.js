const db = require('./db')

exports.up = function (next) {
  const sql = [
    db.dropColumn('devices', 'name')
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
