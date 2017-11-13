const db = require('./db')

exports.up = function (next) {
  const sql = [
    'alter table devices add column name text not null'
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
