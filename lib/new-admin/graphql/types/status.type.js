const { gql } = require('apollo-server-express')

const typeDef = gql`
  type ProcessStatus {
    name: String!
    state: String!
    uptime: Int!
  }

  type Query {
    uptime: [ProcessStatus]
  }
`

module.exports = typeDef
