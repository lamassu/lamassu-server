const _ = require('lodash/fp')
const uuid = require('uuid')

const db = require('../db')
const camelize = require('../utils')

const activateNotificationsByChannel = channelName => db.none('UPDATE notification_channel_preferences SET active = true WHERE channel = $1', channelName)
const deactivateNotificationsByChannel = channelName => db.none('UPDATE notification_channel_preferences SET active = false WHERE channel = $1', channelName)
const activateNotificationsByCategoryAndChannel = (categoryName, channelName) => db.none('UPDATE notification_preferences SET active = true WHERE category = $1 AND channel = $2', [categoryName, channelName])
const deactivateNotificationsByCategoryAndChannel = (categoryName, channelName) => db.none('UPDATE notification_preferences SET active = false WHERE category = $1 AND channel = $2', [categoryName, channelName])

const getNotificationChannelPreferences = () => db.any('SELECT * FROM notification_channel_preferences')
const getNotificationPreferences = () => db.any('SELECT np.event, np.category, np.channel, np.active AND ncp.active AS active FROM notification_preferences np LEFT OUTER JOIN notification_channel_preferences ncp ON np.channel = ncp.channel ORDER BY np.event').then(camelize)
const getNotificationSettings = () => db.any('SELECT * FROM notification_settings').then(camelize).then(_.map(it => _.eq(uuid.NIL, it.overrideId) ? _.set('overrideId', null)(it) : it))
const getNotificationAlerts = () => db.any('SELECT * FROM notification_alert').then(camelize)

const saveNotificationSetting = (eventName, overrideId, newValue) => db.none(`INSERT INTO notification_settings (event, override_id, value) VALUES ($2, $3, $1) ON CONFLICT (event, override_id) DO UPDATE SET value = $1`, [newValue, eventName, _.isNil(overrideId) ? uuid.NIL : overrideId])
const deleteNotificationSetting = (eventName, overrideId) => db.none('DELETE FROM notification_settings WHERE event = $1 AND override_id = $2', [eventName, overrideId])

module.exports = {
  getNotificationChannelPreferences,
  activateNotificationsByChannel,
  deactivateNotificationsByChannel,
  activateNotificationsByCategoryAndChannel,
  deactivateNotificationsByCategoryAndChannel,
  getNotificationPreferences,
  getNotificationSettings,
  getNotificationAlerts,
  saveNotificationSetting,
  deleteNotificationSetting
}
