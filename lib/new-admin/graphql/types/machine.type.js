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
    cassette3: Int
    cassette4: Int
    numberOfCassettes: Int
    statuses: [MachineStatus]
    latestEvent: MachineEvent
    downloadSpeed: String
    responseTime: String
    packetLoss: String
  }

  type UnpairedMachine {
    id: ID!
    deviceId: ID!
    name: String
    model: String
    paired: Date!
    unpaired: Date!
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

  type UpdateEvent {
    id: ID
    deviceId: String
    event: String
    note: String
    newVersion: String
    previousVersion: String
    deviceTime: String
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
    unpairedMachines: [UnpairedMachine!]! @auth
    getMachinesUpdateStatus: [UpdateEvent] @auth
  }

  type Mutation {
    machineAction(deviceId:ID!, action: MachineAction!, cashbox: Int, cassette1: Int, cassette2: Int, cassette3: Int, cassette4: Int, newName: String): Machine @auth
    requestUpdate(deviceId: ID!, event: String!): UpdateEvent @auth
  }
`

module.exports = typeDef
