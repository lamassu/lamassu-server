const { gql } = require('apollo-server-express')

const typeDef = gql`
  type Blacklist {
    address: String!
  }

  type Query {
    blacklist: [Blacklist] @auth
  }

  type Mutation {
    deleteBlacklistRow(address: String!): Blacklist @auth
    insertBlacklistRow(address: String!): Blacklist @auth
  }
`

module.exports = typeDef
