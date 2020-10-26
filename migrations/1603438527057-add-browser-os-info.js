const db = require('./db')

exports.up = function (next) {
  var sql = [
    'ALTER TABLE user_tokens ADD COLUMN browser_version text',
    'ALTER TABLE user_tokens ADD COLUMN os_version text',
    'ALTER TABLE user_tokens ADD COLUMN ip_address inet',
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
