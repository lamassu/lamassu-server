var db = require('./db')

exports.up = function (next) {
  const sql = [
    'alter table trades add column error text',
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  const sql = ['alter table trades drop column error']

  db.multi(sql, next)
}
