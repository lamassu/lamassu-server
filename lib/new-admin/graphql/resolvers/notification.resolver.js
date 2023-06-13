const notifierQueries = require('../../../notifier/queries')
const notifications = require('../../../notifications/notifications')

const resolvers = {
  Query: {
    notifications: () => notifierQueries.getNotifications(),
    hasUnreadNotifications: () => notifierQueries.hasUnreadNotifications(),
    alerts: () => notifierQueries.getAlerts(),
    notificationChannelPreferences: () => notifications.getNotificationChannelPreferences(),
    notificationPreferences: () => notifications.getNotificationPreferences(),
    notificationSettings: () => notifications.getNotificationSettings(),
    notificationAlerts: () => notifications.getNotificationAlerts()
  },
  Mutation: {
    toggleClearNotification: (...[, { id, read }]) => notifierQueries.setRead(id, read),
    clearAllNotifications: () => notifierQueries.markAllAsRead(),
    activateNotificationsByChannel: (...[, { channelName }]) => notifications.activateNotificationsByChannel(channelName),
    deactivateNotificationsByChannel: (...[, { channelName }]) => notifications.deactivateNotificationsByChannel(channelName),
    activateNotificationsByCategoryAndChannel: (...[, { categoryName, channelName }]) => notifications.activateNotificationsByCategoryAndChannel(categoryName, channelName),
    deactivateNotificationsByCategoryAndChannel: (...[, { categoryName, channelName }]) => notifications.deactivateNotificationsByCategoryAndChannel(categoryName, channelName),
    saveNotificationSetting: (...[, { event, overrideId, value }]) => notifications.saveNotificationSetting(event, overrideId, value)
  }
}

module.exports = resolvers
