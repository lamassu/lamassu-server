const uuid = require('uuid')

var db = require('./db')

exports.up = function (next) {
  const defaultMessageId = uuid.v4()

  var sql = [
    `CREATE TABLE blacklist_messages (
      id UUID PRIMARY KEY,
      label TEXT NOT NULL,
      content TEXT NOT NULL,
      allow_toggle BOOLEAN NOT NULL DEFAULT true
    )`,
    `INSERT INTO blacklist_messages (id, label, content, allow_toggle) VALUES ('${defaultMessageId}', 'Suspicious address', 'This address may be associated with a deceptive offer or a prohibited group. Please make sure you''re using an address from your own wallet.', false)`,
    `ALTER TABLE blacklist ADD COLUMN blacklist_message_id UUID REFERENCES blacklist_messages(id) NOT NULL DEFAULT '${defaultMessageId}'`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
