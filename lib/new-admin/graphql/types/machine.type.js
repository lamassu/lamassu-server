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
    cashUnits: CashUnits
    numberOfCassettes: Int
    numberOfStackers: Int
    statuses: [MachineStatus]
    latestEvent: MachineEvent
    downloadSpeed: String
    responseTime: String
    packetLoss: String
  }

  type CashUnits {
    cashbox: Int
    cassette1: Int
    cassette2: Int
    cassette3: Int
    cassette4: Int
    stacker1f: Int
    stacker1r: Int
    stacker2f: Int
    stacker2r: Int
    stacker3f: Int
    stacker3r: Int
  }

  input CashUnitsInput {
    cashbox: Int
    cassette1: Int
    cassette2: Int
    cassette3: Int
    cassette4: Int
    stacker1f: Int
    stacker1r: Int
    stacker2f: Int
    stacker2r: Int
    stacker3f: Int
    stacker3r: Int
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
  }

  type Mutation {
    machineAction(deviceId:ID!, action: MachineAction!, cashUnits: CashUnitsInput, newName: String): Machine @auth
  }
`

module.exports = typeDef
