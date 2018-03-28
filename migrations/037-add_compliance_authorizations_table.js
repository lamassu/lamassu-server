var db = require('./db')

exports.up = function (next) {
  const sql =
    [ "create type compliance_types  as enum ('manual', 'sanctions', 'sanctions_override')",
      `create table compliance_authorizations (
    id uuid PRIMARY KEY,
    customer_id uuid REFERENCES customers (id),
    compliance_type compliance_types NOT NULL,
    authorized_at timestamptz NOT NULL,
    authorized_by text REFERENCES user_tokens (token) )` ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
