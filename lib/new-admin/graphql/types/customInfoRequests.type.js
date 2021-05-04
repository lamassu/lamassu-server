const { gql } = require('apollo-server-express')

const typeDef = gql`

  type CustomInfoRequest {
    id: ID!,
    enabled: Boolean,
    customRequest: JSON
  }

  type Query {
    customInfoRequests: [CustomInfoRequest]
  }

  type Mutation {
    insertCustomInfoRequest(customRequest: JSON!): Boolean
  }
`

module.exports = typeDef
