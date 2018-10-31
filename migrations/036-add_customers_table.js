var db = require('./db')
var anonymous = require('../lib/constants').anonymousCustomer

exports.up = function (next) {
  const sql =
    [`create table if not exists customers (
      id uuid PRIMARY KEY,
      phone text unique,
      phone_at timestamptz,
      id_card_number text,
      id_card_expiration date,
      id_card_data json,
      id_card_at timestamptz,
      name text,
      address text,
      manually_verified boolean,
      sanctions_check boolean,
      front_facing_cam_path text,
      front_facing_cam_at timestamptz,
      id_card_image_path text,
      id_card_image_at timestamptz,
      created timestamptz NOT NULL DEFAULT now() )`,
    `insert into customers (id, name) VALUES ('${anonymous.uuid}','${anonymous.name}') ON CONFLICT DO NOTHING`,
    db.addColumn('cash_in_txs', 'customer_id', `uuid references customers (id) DEFAULT '${anonymous.uuid}'`),
    db.addColumn('cash_out_txs', 'customer_id', `uuid references customers (id) DEFAULT '${anonymous.uuid}'`)
    ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
