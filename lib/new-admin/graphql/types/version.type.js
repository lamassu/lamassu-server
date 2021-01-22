const { gql } = require('apollo-server-express')

const typeDef = gql`
  type Query {
    serverVersion: String!
  }
`

module.exports = typeDef
