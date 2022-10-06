const { gql } = require('apollo-server-express')

const typeDef = gql`
  type Blacklist {
    address: String!
    blacklistMessage: BlacklistMessage!
  }

  type BlacklistMessage {
    id: ID
    label: String
    content: String
    allowToggle: Boolean
  }

  type Query {
    blacklist: [Blacklist] @auth
    blacklistMessages: [BlacklistMessage] @auth
  }

  type Mutation {
    deleteBlacklistRow(address: String!): Blacklist @auth
    insertBlacklistRow(address: String!): Blacklist @auth
    editBlacklistMessage(id: ID, content: String): BlacklistMessage @auth
  }
`

module.exports = typeDef
