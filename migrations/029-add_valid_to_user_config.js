var db = require('./db')

exports.up = function (next) {
  var sql = [
    db.addColumn('user_config', 'valid', 'boolean not null')
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
