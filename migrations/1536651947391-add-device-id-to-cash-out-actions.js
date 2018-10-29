var db = require('./db')

exports.up = function (next) {
  var sql = [
    db.addColumn('cash_out_actions', 'device_id', 'text not null default \'\'')
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
