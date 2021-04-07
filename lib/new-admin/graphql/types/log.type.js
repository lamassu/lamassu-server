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
    machineLogs(deviceId: ID!, from: Date, until: Date, limit: Int, offset: Int): [MachineLog] @auth
    machineLogsCsv(deviceId: ID!, from: Date, until: Date, limit: Int, offset: Int): String @auth
    serverLogs(from: Date, until: Date, limit: Int, offset: Int): [ServerLog] @auth
    serverLogsCsv(from: Date, until: Date, limit: Int, offset: Int): String @auth
  }
`

module.exports = typeDef
