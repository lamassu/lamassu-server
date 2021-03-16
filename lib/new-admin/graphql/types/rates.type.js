const { gql } = require('apollo-server-express')

const typeDef = gql`
  type Rate {
    code: String
    name: String
    rate: Float
  }

  type Query {
    cryptoRates: JSONObject
    fiatRates: [Rate]
  }
`

module.exports = typeDef
