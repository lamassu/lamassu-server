var db = require('./db')

exports.up = function (next) {
  const sql = [
    db.defineEnum('compliance_types', "'manual', 'sanctions', 'sanctions_override'"),
    `create table if not exists compliance_authorizations (
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
