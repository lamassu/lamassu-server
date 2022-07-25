const { gql } = require('apollo-server-express')

const typeDef = gql`
  type Query {
    serverVersion: String! @auth(permissions: ["serverVersion:read"])
  }
`

module.exports = typeDef
