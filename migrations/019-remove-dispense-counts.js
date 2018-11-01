var db = require('./db')

exports.up = function (next) {
  var sql = [
    db.dropColumn('dispenses', 'count1'),
    db.dropColumn('dispenses', 'count2'),
    db.dropColumn('dispenses', 'refill')
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
