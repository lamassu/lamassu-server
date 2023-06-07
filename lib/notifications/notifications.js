const db = require('../db')
const camelize = require('../utils')

const activateNotificationsByChannel = channelName => db.none('UPDATE notification_preferences SET active = true WHERE channel = $1', channelName)
const deactivateNotificationsByChannel = channelName => db.none('UPDATE notification_preferences SET active = false WHERE channel = $1', channelName)
const activateNotificationsByCategory = categoryName => db.none('UPDATE notification_preferences SET active = true WHERE category = $1', categoryName)
const deactivateNotificationsByCategory = categoryName => db.none('UPDATE notification_preferences SET active = false WHERE category = $1', categoryName)

const getNotificationPreferences = () => db.any('SELECT * FROM notification_preferences').then(camelize)
const getNotificationSettings = () => db.any('SELECT * FROM notification_settings').then(camelize)
const getNotificationQueue = () => db.any('SELECT * FROM notification_queue').then(camelize)

module.exports = {
  activateNotificationsByChannel,
  deactivateNotificationsByChannel,
  activateNotificationsByCategory,
  deactivateNotificationsByCategory,
  getNotificationPreferences,
  getNotificationSettings,
  getNotificationQueue
}
