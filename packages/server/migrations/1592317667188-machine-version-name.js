const db = require('./db')

exports.up = function (next) {
  var sql = [
    'alter table devices add column version text',
    'alter table devices add column model text'
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
