const db = require('./db')

exports.up = function (next) {
  var sql = [
    'ALTER TABLE user_tokens ADD COLUMN user_agent text',
    'ALTER TABLE user_tokens ADD COLUMN ip_address inet',
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
