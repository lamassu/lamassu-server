const { gql } = require('apollo-server-express')

const typeDef = gql`
  type Mutation {
    createPairingTotem(name: String!): String @auth
  }
`

module.exports = typeDef
