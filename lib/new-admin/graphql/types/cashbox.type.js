const { gql } = require('apollo-server-express')

const typeDef = gql`
  type CashboxBatch {
    id: ID
    deviceId: ID
    created: Date
    operationType: String
    customBillCount: Int
    performedBy: String
    billCount: Int
    fiatTotal: Int
  }

  type Query {
    cashboxBatches: [CashboxBatch] @auth
    cashboxBatchesCsv(from: Date, until: Date, timezone: String): String @auth
  }

  type Mutation {
    createBatch(deviceId: ID, cashboxCount: Int): CashboxBatch @auth
    editBatch(id: ID, performedBy: String): CashboxBatch @auth
  }
`

module.exports = typeDef
