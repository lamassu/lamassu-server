const { gql } = require('apollo-server-express')

const typeDef = gql`
  type Blacklist {
    cryptoCode: String!
    address: String!
  }

  type Query {
    blacklist: [Blacklist] @auth(permissions: ["blacklist:read"])
  }

  type Mutation {
    deleteBlacklistRow(cryptoCode: String!, address: String!): Blacklist @auth(permissions: ["blacklist:delete"])
    insertBlacklistRow(cryptoCode: String!, address: String!): Blacklist @auth(permissions: ["blacklist:create"])
  }
`

module.exports = typeDef
