var db = require('./db')

exports.up = function(next) {
  const sql =
    [
    'CREATE TABLE customers ( ' +
    'id uuid PRIMARY KEY,' +
    'phone text unique NOT NULL,' +
    'phone_at timestamptz NOT NULL,' +
    'id_card_number text,' +
    'id_card_expiration date,' +
    'id_card_data json,' +
    'id_card_at timestamptz,' +
    'name text,' +
    'address text,' +
    'manually_verified boolean,' +
    'sanctions_check boolean,' +
    'front_facing_cam_path text,' +
    'front_facing_cam_at timestamptz,' +
    'id_card_image_path text,' +
    'id_card_image_at timestamptz,' +
    'created timestamptz NOT NULL DEFAULT now() )',
    'ALTER TABLE cash_in_txs add column customer_id uuid REFERENCES customers (id)',
    'ALTER TABLE cash_out_txs add column customer_id uuid REFERENCES customers (id)'
  ]

  db.multi(sql, next)
};

exports.down = function(next) {
  next();
};
