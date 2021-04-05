var db = require('./db')

exports.up = function (next) {
  var sqls = [
    `create table cashbox_batches (
      id uuid PRIMARY KEY,
      device_id text REFERENCES devices (device_id),
      created timestamptz NOT NULL default now()
    )`,

    `ALTER TABLE bills ADD COLUMN legacy boolean DEFAULT false`,

    `ALTER TABLE bills ADD COLUMN cashbox_batch_id int`,

    `ALTER TABLE bills ADD CONSTRAINT cashbox_batch_id
    FOREIGN KEY (cashbox_batch_id)
    REFERENCES cashbox_batches (id)`,

    `UPDATE bills SET legacy = 'true'`
  ]
  db.multi(sqls, next)
}

exports.down = function (next) {
  next()
}
