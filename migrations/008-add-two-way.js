var db = require('./db')

function singleQuotify (item) { return '\'' + item + '\'' }

exports.up = function (next) {
  var statuses = ['notSeen', 'published', 'authorized', 'instant',
    'confirmed', 'rejected', 'insufficientFunds']
    .map(singleQuotify).join(',')

  var sql = [
    'create type status_stage AS enum (' + statuses + ')',
    'alter table transactions add dispensed boolean NOT NULL DEFAULT false',
    'alter table transactions add notified boolean NOT NULL DEFAULT false',
    'alter table transactions add redeem boolean NOT NULL DEFAULT false',
    'alter table transactions add confirmation_time timestamptz',
    'alter table transactions add status status_stage NOT NULL DEFAULT \'notSeen\''
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
