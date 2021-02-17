var db = require('./db')

const singleQuotify = (item) => `'${item}'`

var types = [
  'highValueTransaction',
  'transaction',
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
    CREATE TABLE "notifications" (
        "id" uuid NOT NULL PRIMARY KEY,
        "type" notification_type NOT NULL,
        "detail" JSONB,
        "message" TEXT NOT NULL,
        "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "read" BOOLEAN NOT NULL DEFAULT 'false',
        "valid" BOOLEAN NOT NULL DEFAULT 'true'
    );
    CREATE INDEX ON notifications (valid);
    CREATE INDEX ON notifications (read);`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
