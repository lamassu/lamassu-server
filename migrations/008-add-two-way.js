var db = require('./db')

function singleQuotify (item) { return '\'' + item + '\'' }

exports.up = function (next) {
  var statuses = ['notSeen', 'published', 'authorized', 'confirmed', 'rejected']
  .map(singleQuotify).join(',')

  var sql = [
    'create type status_stage AS enum (' + statuses + ')',
    'alter table transactions add dispensed boolean NOT NULL DEFAULT false',
    'alter table transactions add status status_stage NOT NULL DEFAULT \'notSeen\''
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
