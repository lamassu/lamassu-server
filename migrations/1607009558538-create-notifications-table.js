var db = require('./db')

function singleQuotify(item) {
  return "'" + item + "'"
}

var types = [
  'highValueTransaction',
  'fiatBalance',
  'cryptoBalance',
  'compliance',
  'error'
]
  .map(singleQuotify)
  .join(',')

exports.up = function (next) {
  const sql = [
    `
    CREATE TYPE notification_type AS ENUM ${'(' + types + ')'};
    CREATE TABLE IF NOT EXISTS "notifications" (
        "id" uuid NOT NULL PRIMARY KEY,
        "type" notification_type NOT NULL,
        "device_id" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "created" time with time zone NOT NULL,
        "read" BOOLEAN NOT NULL DEFAULT 'false',
        CONSTRAINT fk_devices
            FOREIGN KEY(device_id)
                REFERENCES devices(device_id)
                ON DELETE CASCADE
    );
    CREATE INDEX ON notifications (read);`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
