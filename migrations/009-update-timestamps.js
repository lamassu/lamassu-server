var db = require('./db')

exports.up = function (next) {
  var sql = [
    'alter table transactions alter created type timestamptz',
    'alter table bills alter created type timestamptz',
    'alter table dispenses alter created type timestamptz',
    'alter table machine_events alter created type timestamptz',
    'alter table pairing_tokens alter created type timestamptz',
    'alter table pending_transactions alter updated type timestamptz'
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
