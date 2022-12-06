const { gql } = require('apollo-server-express')

const typeDef = gql`
  type TestingAddress {
    cryptoCode: String!
    address: String!
  }

  type Query {
    testingAddresses: [TestingAddress] @auth
  }

  type Mutation {
    addTestingAddress(cryptoCode: String!, address: String!): TestingAddress @auth
    deleteTestingAddress(cryptoCode: String!, address: String!): TestingAddress @auth
  }
`

module.exports = typeDef
