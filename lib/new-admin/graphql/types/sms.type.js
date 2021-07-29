const { gql } = require('apollo-server-express')

const typeDef = gql`
  type CustomMessage {
    id: ID!
    event: CustomMessageEvent!
    deviceId: String
    message: String!
  }

  enum CustomMessageEvent {
    smsCode
    cashOutDispenseReady
  }

  type Query {
    customMessages: [CustomMessage] @auth
  }

  type Mutation {
    createCustomMessage(event: CustomMessageEvent!, deviceId: String, message: String!): CustomMessage @auth
  }
`

module.exports = typeDef
