const notifierQueries = require('../../../notifier/queries')

const resolvers = {
  Query: {
    notifications: () => notifierQueries.getNotifications(),
    hasUnreadNotifications: () => notifierQueries.hasUnreadNotifications(),
    alerts: () => notifierQueries.getAlerts()
  },
  Mutation: {
    toggleClearNotification: (...[, { id, read }]) => notifierQueries.setRead(id, read),
    clearAllNotifications: () => notifierQueries.markAllAsRead()
  }
}

module.exports = resolvers
