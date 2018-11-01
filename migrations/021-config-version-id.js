var db = require('./db')

exports.up = function (next) {
  var sql = [
    db.addColumn('devices', 'user_config_id', 'int'),
    db.addColumn('user_config', 'created', 'timestamptz NOT NULL default now()'),
    db.addConstraint('devices', 'user_config_id', 'FOREIGN KEY (user_config_id) REFERENCES user_config (id)')
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
