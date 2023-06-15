const { gql } = require('apollo-server-express')

const typeDef = gql`
  type Notification {
    id: ID!
    type: String
    detail: JSON
    message: String
    created: Date
    read: Boolean
    valid: Boolean
  }

  enum NotificationEvent {
    cryptoBalance
    unitFillThreshold
    transactionValue
    transactionFinished
    customerCreated
    customerCompliance
    physicalUnitMoved
    machineState
    billIssue
  }

  enum NotificationCategory {
    balance
    transactions
    compliance
    security
    system
    errors
  }

  enum NotificationChannel {
    sms
    email
    admin
    webhook
  }

  type NotificationPreference {
    event: NotificationEvent
    category: NotificationCategory
    channel: NotificationChannel
    active: Boolean
  }

  type NotificationChannelPreference {
    channel: NotificationChannel
    active: Boolean
  }

  type NotificationSetting {
    event: NotificationEvent
    overrideId: ID
    value: JSONObject
  }

  type NotificationAlert {
    id: ID
    event: NotificationEvent
    category: NotificationCategory
    context: JSONObject
    createdAt: Date
    read: Boolean
  }

  type Query {
    notifications: [Notification] @auth
    alerts: [Notification] @auth
    hasUnreadNotifications: Boolean @auth
    notificationChannelPreferences: [NotificationChannelPreference] @auth
    notificationPreferences: [NotificationPreference] @auth
    notificationSettings: [NotificationSetting] @auth
    notificationAlerts: [NotificationAlert] @auth
  }

  type Mutation {
    toggleClearNotification(id: ID!, read: Boolean!): Notification @auth
    clearAllNotifications: Notification @auth
    activateNotificationsByChannel(channelName: String): Boolean @auth
    deactivateNotificationsByChannel(channelName: String): Boolean @auth
    activateNotificationsByCategoryAndChannel(categoryName: String, channelName: String): Boolean @auth
    deactivateNotificationsByCategoryAndChannel(categoryName: String, channelName: String): Boolean @auth
    saveNotificationSetting(event: NotificationEvent, overrideId: ID, value: JSONObject): Boolean @auth
    deleteNotificationSetting(event: NotificationEvent, overrideId: ID): Boolean @auth
  }
`

module.exports = typeDef
