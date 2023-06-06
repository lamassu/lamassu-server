const { gql } = require('apollo-server-express')

const typeDef = gql`
  type Bill {
    id: ID
    fiat: Int
    fiatCode: String
    deviceId: ID
    created: Date
    cashUnitOperationId: ID
  }

  type Query {
    bills(filters: JSONObject): [Bill] @auth
  }
`

module.exports = typeDef
