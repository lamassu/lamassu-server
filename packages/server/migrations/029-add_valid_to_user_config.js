var db = require('./db')

exports.up = function (next) {
  var sql = [
    'alter table user_config add column valid boolean not null'
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
