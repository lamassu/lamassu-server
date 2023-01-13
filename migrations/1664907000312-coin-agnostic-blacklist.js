var db = require('./db')

exports.up = function (next) {
  var sql = [
    `CREATE TABLE blacklist_temp (
      address TEXT NOT NULL UNIQUE
    )`,
    `INSERT INTO blacklist_temp (address) SELECT DISTINCT address FROM blacklist`,
    `DROP TABLE blacklist`,
    `ALTER TABLE blacklist_temp RENAME TO blacklist`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
