var db = require('./db')

exports.up = function (next) {
  var sql = [
    db.defineEnum('trade_type', "'buy', 'sell'"),
    `create table if not exists trades (
      id serial PRIMARY KEY,
      type trade_type not null,
      crypto_code text not null,
      crypto_atoms bigint not null,
      fiat_code text not null,
      created timestamptz NOT NULL default now()
    )`
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
