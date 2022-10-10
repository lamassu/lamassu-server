const { gql } = require('apollo-server-express')

const typeDef = gql`
  type SanctionMatches {
    ofacSanctioned: Boolean
  }

  type Query {
    checkAgainstSanctions(customerId: ID): SanctionMatches @auth
  }
`

module.exports = typeDef
