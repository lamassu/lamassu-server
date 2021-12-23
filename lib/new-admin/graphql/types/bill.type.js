const { gql } = require('apollo-server-express')

const typeDef = gql`
  type Bill {
    id: ID
    fiat: Int
    deviceId: ID
    created: Date
    cashboxBatchId: ID
  }

  type Query {
    bills(filters: JSONObject): [Bill] @auth
  }
`

module.exports = typeDef
