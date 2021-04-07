const { gql } = require('apollo-server-express')

const typeDef = gql`
  type Rate {
    code: String
    name: String
    rate: Float
  }

  type Query {
    cryptoRates: JSONObject @auth
    fiatRates: [Rate] @auth
  }
`

module.exports = typeDef
