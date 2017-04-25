var db = require('./db')

exports.up = function (next) {
  var sql = [
    'delete from user_config',
    'alter table user_config add column valid boolean not null'
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
