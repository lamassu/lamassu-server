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
    notifications: [Notification] @auth
    alerts: [Notification] @auth
    hasUnreadNotifications: Boolean @auth
  }

  type Mutation {
    toggleClearNotification(id: ID!, read: Boolean!): Notification @auth
    clearAllNotifications: Notification @auth
  }
`

module.exports = typeDef
