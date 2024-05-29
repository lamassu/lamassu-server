const db = require('./db')

exports.up = function (next) {
  let sql = [
    'alter table devices add column diagnostics_timestamp timestamptz',
    'alter table devices add column diagnostics_scan_updated_at timestamptz',
    'alter table devices add column diagnostics_front_updated_at timestamptz'
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
