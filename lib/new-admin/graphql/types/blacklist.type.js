const { gql } = require('apollo-server-express')

const typeDef = gql`
  type Blacklist {
    createdByOperator: Boolean!
    cryptoCode: String!
    address: String!
  }

  type Query {
    blacklist: [Blacklist] @auth
  }

  type Mutation {
    deleteBlacklistRow(cryptoCode: String!, address: String!): Blacklist @auth
    insertBlacklistRow(cryptoCode: String!, address: String!): Blacklist @auth
  }
`

module.exports = typeDef
