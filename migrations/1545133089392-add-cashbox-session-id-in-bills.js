var db = require('./db')

exports.up = function (next) {
  const sql = [
    'alter table bills add column cashbox_session_id text',
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  const sql = ['alter table bills drop column cashbox_session_id']

  db.multi(sql, next)
}
