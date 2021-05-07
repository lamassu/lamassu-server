var db = require('./db')

exports.up = function (next) {
  var sql = [
    `ALTER TABLE user_register_tokens ADD COLUMN use_fido BOOLEAN DEFAULT false`,
    `CREATE TABLE hardware_credentials (
      id UUID PRIMARY KEY,
      user_id UUID REFERENCES users(id),
      created TIMESTAMPTZ DEFAULT now(),
      last_used TIMESTAMPTZ DEFAULT now(),
      data JSONB
    )`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
