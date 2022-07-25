const { gql } = require('apollo-server-express')

const typeDef = gql`
  type CashboxBatch {
    id: ID
    deviceId: ID
    created: Date
    operationType: String
    customBillCount: Int
    performedBy: String
    bills: [Bill]
  }

  type Query {
    cashboxBatches: [CashboxBatch] @auth(permissions: ["cashboxBatches:read"])
    cashboxBatchesCsv(from: Date, until: Date, timezone: String): String @auth(permissions: ["cashboxBatches:download"])
  }

  type Mutation {
    createBatch(deviceId: ID, cashboxCount: Int): CashboxBatch @auth(permissions: ["cashboxBatches:write"])
    editBatch(id: ID, performedBy: String): CashboxBatch @auth(permissions: ["cashboxBatches:edit"])
  }
`

module.exports = typeDef
