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
    notifications: [Notification] @auth(permissions: ["notifications:read"])
    alerts: [Notification] @auth(permissions: ["alerts:read"])
    hasUnreadNotifications: Boolean @auth(permissions: ["notifications:read"])
  }

  type Mutation {
    toggleClearNotification(id: ID!, read: Boolean!): Notification @auth(permissions: ["notifications:edit"])
    clearAllNotifications: Notification @auth(permissions: ["notifications:edit"])
  }
`

module.exports = typeDef
