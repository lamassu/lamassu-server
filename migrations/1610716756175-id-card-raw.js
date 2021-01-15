var db = require('./db')

exports.up = function (next) {
  var sql = [
    'ALTER TABLE customers ADD COLUMN id_card_data_raw text'
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
