var db = require('./db')

exports.up = function (next) {
  var sql = [
    `CREATE TABLE customer_notes (
      id UUID PRIMARY KEY,
      customer_id UUID NOT NULL REFERENCES customers(id),
      created TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_edited_at TIMESTAMPTZ,
      last_edited_by UUID REFERENCES users(id),
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT ''
    )`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
