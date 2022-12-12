const { gql } = require('apollo-server-express')

const typeDef = gql`
  type Mutation {
    createPairingTotem(name: String!, location: JSONObject!): String @auth
  }
`

module.exports = typeDef
