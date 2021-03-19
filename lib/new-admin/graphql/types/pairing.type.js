const { gql } = require('apollo-server-express')

const typeDef = gql`
  type Mutation {
    createPairingTotem(name: String!): String
  }
`

module.exports = typeDef
