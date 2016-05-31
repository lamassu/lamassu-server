var db = require('./db')

exports.up = function (next) {
  var sql = [
    `create table cash_out_hds (
      session_id uuid PRIMARY KEY,
      to_address text NOT NULL,
      crypto_code text NOT NULL,
      hd_path_prefix text NOT NULL,
      hd_serial integer NOT NULL,
      created timestamptz NOT NULL default now(),
      unique (crypto_code, hd_serial)
    )`
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
