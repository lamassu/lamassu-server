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
    diagnostics: Diagnostics
    version: String
    model: String
    cashUnits: CashUnits
    numberOfCassettes: Int
    numberOfRecyclers: Int
    statuses: [MachineStatus]
    latestEvent: MachineEvent
    downloadSpeed: String
    responseTime: String
    packetLoss: String
  }

  type Diagnostics {
    timestamp: Date
    frontTimestamp: Date
    scanTimestamp: Date
  }
  
  type CashUnits {
    cashbox: Int
    cassette1: Int
    cassette2: Int
    cassette3: Int
    cassette4: Int
    recycler1: Int
    recycler2: Int
    recycler3: Int
    recycler4: Int
    recycler5: Int
    recycler6: Int
  }

  input CashUnitsInput {
    cashbox: Int
    cassette1: Int
    cassette2: Int
    cassette3: Int
    cassette4: Int
    recycler1: Int
    recycler2: Int
    recycler3: Int
    recycler4: Int
    recycler5: Int
    recycler6: Int
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
    resetCashOutBills
    setCassetteBills
    unpair
    reboot
    shutdown
    restartServices
    emptyUnit
    refillUnit
    diagnostics
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
