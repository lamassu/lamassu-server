const { gql } = require('apollo-server-express')

const typeDef = gql`
  type Query {
    getApplicantAccessToken(customerId: ID, triggerId: ID): String
  }
`

module.exports = typeDef
