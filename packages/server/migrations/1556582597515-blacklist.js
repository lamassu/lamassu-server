var db = require('./db')

exports.up = function (next) {
  const sql =
    [`create table blacklist (
        crypto_code text not null,
        address text not null,
        unique (crypto_code, address)
      )`
    ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
