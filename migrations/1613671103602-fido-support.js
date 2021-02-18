var db = require('./db')

exports.up = function (next) {
  var sql = [
    'ALTER TABLE user_register_tokens ADD COLUMN use_fido BOOLEAN DEFAULT false',
    'ALTER TABLE users ADD COLUMN hardware_credentials JSONB'
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
