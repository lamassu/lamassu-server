const { gql } = require('apollo-server-express')

const typeDef = gql`
  type Query {
    getMarkets: JSONObject @auth
  }
`

module.exports = typeDef
