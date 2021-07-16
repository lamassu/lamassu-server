const { gql } = require('apollo-server-express')

const typeDef = gql`
  type MachineStatus {
    label: String!
    type: String!
  }

  type Machine {
    name: String!
    deviceId: ID!
    paired: Boolean!
    lastPing: Date
    pairedAt: Date
    version: String
    model: String
    cashbox: Int
    cassette1: Int
    cassette2: Int
    statuses: [MachineStatus]
    latestEvent: MachineEvent
    downloadSpeed: String
    responseTime: String
    packetLoss: String
  }

  type MachineEvent {
    id: ID
    deviceId: String
    eventType: String
    note: String
    created: Date
    age: Float
    deviceTime: Date
  }

  enum MachineAction {
    rename
    emptyCashInBills
    resetCashOutBills
    setCassetteBills
    unpair
    reboot
    shutdown
    restartServices
  }

  type Query {
    machines: [Machine] @auth
    machine(deviceId: ID!): Machine @auth
  }

  type Mutation {
    machineAction(deviceId:ID!, action: MachineAction!, cashbox: Int, cassette1: Int, cassette2: Int, newName: String): Machine @auth
  }
`

module.exports = typeDef
