const db = require('./db')
const { migrationSaveConfig, loadLatest } = require('../lib/new-settings-loader')

exports.up = function (next) {
  const sql = [
    `ALTER TYPE notification_type ADD VALUE 'security'`
  ]

  const newConfig = {}
  newConfig.notifications_email_security = true
  newConfig.notifications_sms_security = true
  newConfig.notifications_notificationCenter_security = true

  return migrationSaveConfig(newConfig)
    .then(() => db.multi(sql, next))
    .catch(err => {
      return next(err)
    })
}

module.exports.down = function (next) {
  next()
}
