const { gql } = require('apollo-server-express')

const typeDef = gql`
  type Rate {
    code: String
    name: String
    rate: Float
  }

  type Query {
    cryptoRates: JSONObject @auth(permissions: ["ratesCrypto:read"])
    fiatRates: [Rate] @auth(permissions: ["ratesFiat:read"])
  }
`

module.exports = typeDef
