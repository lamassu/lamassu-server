const db = require('./db')
const { saveConfig, loadLatest } = require('../lib/new-settings-loader')

exports.up = function (next) {
  const sql = [
    `ALTER TYPE notification_type ADD VALUE 'security'`
  ]

  return loadLatest()
    .then(config => {
      const newConfig = {}
      if(config.notifications_email_active) {
        newConfig.notifications_email_security = true
      }
      if(config.notifications_sms_active) {
        newConfig.notifications_sms_security = true
      }
      if(config.notifications_notificationCenter_active) {
        newConfig.notifications_notificationCenter_security = true
      }

      return saveConfig(newConfig)
        .then(() => db.multi(sql, next))
        .catch(err => {
          if (err.message === 'lamassu-server is not configured') {
            return next()
          }
          return next(err)
        })
    })
}

module.exports.down = function (next) {
  next()
}
