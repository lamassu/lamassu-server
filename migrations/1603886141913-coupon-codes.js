var db = require('./db')

exports.up = function (next) {
  const sql =
    [
      `CREATE TABLE coupons (
        id UUID PRIMARY KEY,
        code TEXT NOT NULL,
        discount SMALLINT NOT NULL,
        soft_deleted BOOLEAN DEFAULT false )`,
      `CREATE UNIQUE INDEX uq_code ON coupons (code) WHERE NOT soft_deleted`
    ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
