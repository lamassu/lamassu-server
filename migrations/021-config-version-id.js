var db = require('./db')

exports.up = function (next) {
  var sql = [
    'alter table devices add column user_config_id int',
    `ALTER TABLE devices ADD CONSTRAINT user_config_id
    FOREIGN KEY (user_config_id)
    REFERENCES user_config (id)`
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
