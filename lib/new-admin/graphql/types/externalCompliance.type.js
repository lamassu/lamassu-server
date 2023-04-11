const { gql } = require('apollo-server-express')

const typeDef = gql`
  type Query {
    getApplicantExternalLink(customerId: ID, triggerId: ID): String
  }
`

module.exports = typeDef
