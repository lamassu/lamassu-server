var db = require('./db')
var smsNotices = require('../lib/sms-notices')

exports.up = function (next) {
  var sql = [
    `ALTER TABLE custom_messages RENAME TO sms_notices`,
    `ALTER TYPE custom_message_event RENAME TO sms_notice_event`,
    `ALTER TYPE sms_notice_event ADD VALUE 'sms_receipt'`,
    `ALTER TABLE sms_notices ADD COLUMN message_name TEXT UNIQUE NOT NULL`,
    `ALTER TABLE sms_notices ADD COLUMN enabled BOOLEAN NOT NULL DEFAULT true`,
    `ALTER TABLE sms_notices ADD COLUMN allow_toggle BOOLEAN NOT NULL DEFAULT true`
  ]

  db.multi(
    sql,
    () => Promise.all([
      smsNotices.createSMSNotice('sms_code', 'SMS confirmation code', 'Your cryptomat code: #code', true, false),
      smsNotices.createSMSNotice('cash_out_dispense_ready', 'Cash is ready', 'Your cash is waiting! Go to the Cryptomat and press Redeem within 24 hours. [#timestamp]', true, false),
      smsNotices.createSMSNotice('sms_receipt', 'SMS receipt', '', true, true)
    ])
      .then(() => next())
  )
}

exports.down = function (next) {
  next()
}
