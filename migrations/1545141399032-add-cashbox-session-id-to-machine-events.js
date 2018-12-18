var db = require('./db')

exports.up = function (next) {
  const sql = [
    'alter table machine_events add column cashbox_session_id text',
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  const sql = ['alter table machine_events drop column cashbox_session_id']

  db.multi(sql, next)
}