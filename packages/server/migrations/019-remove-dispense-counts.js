var db = require('./db')

exports.up = function (next) {
  var sql = [
    'alter table dispenses drop column count1',
    'alter table dispenses drop column count2',
    'alter table dispenses drop column refill'
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
