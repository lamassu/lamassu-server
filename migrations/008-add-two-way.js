var db = require('./db')

function singleQuotify (item) { return '\'' + item + '\'' }

exports.up = function (next) {
  var statuses = ['notSeen', 'published', 'authorized', 'instant',
    'confirmed', 'rejected', 'insufficientFunds']
    .map(singleQuotify).join(',')

  var sql = [
    db.defineEnum('status_stage', statuses),
    db.addColumn('transactions', 'dispensed', 'boolean NOT NULL DEFAULT false'),
    db.addColumn('transactions', 'notified', 'boolean NOT NULL DEFAULT false'),
    db.addColumn('transactions', 'redeem', 'boolean NOT NULL DEFAULT false'),
    db.addColumn('transactions', 'confirmation_time', 'timestamptz'),
    db.addColumn('transactions', 'status', 'status_stage NOT NULL DEFAULT \'notSeen\'')
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
