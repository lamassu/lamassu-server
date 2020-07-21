const db = require('./db')

module.exports.up = function (next) {
  var sql = [
    'alter table user_config add column schema_version smallint DEFAULT 1'
  ]

  db.multi(sql, next)
}

module.exports.down = function (next) {
  next()
}
