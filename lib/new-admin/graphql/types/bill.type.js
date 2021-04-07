const { gql } = require('apollo-server-express')

const typeDef = gql`
  type Bill {
    fiat: Int
    deviceId: ID
    created: Date
    cashbox: Int
  }

  type Query {
    bills: [Bill] @auth
  }
`

module.exports = typeDef
