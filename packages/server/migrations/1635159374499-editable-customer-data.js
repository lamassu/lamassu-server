const db = require('./db')

exports.up = function (next) {
  var sql = [
    `CREATE TABLE edited_customer_data (
        customer_id uuid PRIMARY KEY REFERENCES customers(id),
        id_card_data JSON,
        id_card_data_at TIMESTAMPTZ,
        id_card_data_by UUID REFERENCES users(id),
        front_camera_path TEXT,
        front_camera_at TIMESTAMPTZ,
        front_camera_by UUID REFERENCES users(id),
        id_card_photo_path TEXT,
        id_card_photo_at TIMESTAMPTZ,
        id_card_photo_by UUID REFERENCES users(id),
        subscriber_info JSON, 
        subscriber_info_at TIMESTAMPTZ,
        subscriber_info_by UUID REFERENCES users(id),
        name TEXT,
        name_at TIMESTAMPTZ,
        name_by UUID REFERENCES users(id),
        us_ssn TEXT,
        us_ssn_at TIMESTAMPTZ,
        us_ssn_by UUID REFERENCES users(id),
        created TIMESTAMPTZ NOT NULL DEFAULT now() )`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
