const { gql } = require('apollo-server-express')

const typeDef = gql`
  type MachineLog {
    id: ID!
    logLevel: String!
    timestamp: Date!
    message: String!
  }

  type ServerLog {
    id: ID!
    logLevel: String!
    timestamp: Date!
    message: String
  }

  type Query {
    machineLogs(deviceId: ID!, from: Date, until: Date, limit: Int, offset: Int): [MachineLog] @auth(permissions: ["machineLog:read"])
    machineLogsCsv(deviceId: ID!, from: Date, until: Date, limit: Int, offset: Int, timezone: String): String @auth(permissions: ["machineLog:download"])
    serverLogs(from: Date, until: Date, limit: Int, offset: Int): [ServerLog] @auth(permissions: ["serverLog:read"])
    serverLogsCsv(from: Date, until: Date, limit: Int, offset: Int, timezone: String): String @auth(permissions: ["serverLog:download"])
  }
`

module.exports = typeDef
