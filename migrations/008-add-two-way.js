var db = require('./db')

exports.up = function (next) {
  var sql = [
    'alter table transactions add dispensed boolean NOT NULL DEFAULT false',
    'alter table transactions add authorized boolean NOT NULL DEFAULT false'
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
