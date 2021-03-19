const { gql } = require('apollo-server-express')

const typeDef = gql`
  type Blacklist {
    createdByOperator: Boolean!
    cryptoCode: String!
    address: String!
  }

  type Query {
    blacklist: [Blacklist]
  }

  type Mutation {
    deleteBlacklistRow(cryptoCode: String!, address: String!): Blacklist
    insertBlacklistRow(cryptoCode: String!, address: String!): Blacklist
  }
`

module.exports = typeDef
