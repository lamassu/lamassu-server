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

  type Query {
    notifications: [Notification]
    alerts: [Notification]
    hasUnreadNotifications: Boolean
  }

  type Mutation {
    toggleClearNotification(id: ID!, read: Boolean!): Notification
    clearAllNotifications: Notification
  }
`

module.exports = typeDef
