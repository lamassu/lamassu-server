const { gql } = require('apollo-server-express')

const typeDef = gql`
  type SanctionMatches {
    ofacSanctioned: Boolean
  }

  type Query {
    checkAgainstSanctions(firstName: String, lastName: String, birthdate: String): SanctionMatches @auth
  }
`

module.exports = typeDef
