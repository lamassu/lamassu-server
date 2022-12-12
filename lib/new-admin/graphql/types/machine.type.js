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
    location: MachineLocation
  }

  type MachineLocation {
    id: ID
    label: String
    addressLine1: String
    addressLine2: String
    zipCode: String
    country: String
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
    editLocation
    deleteLocation
    createLocation
  }

  type Query {
    machines: [Machine] @auth
    machine(deviceId: ID!): Machine @auth
    unpairedMachines: [UnpairedMachine!]! @auth
    machineLocations: [MachineLocation] @auth
  }

  type Mutation {
    machineAction(deviceId:ID!, action: MachineAction!, cashbox: Int, cassette1: Int, cassette2: Int, cassette3: Int, cassette4: Int, newName: String, location: JSONObject): Machine @auth
  }
`

module.exports = typeDef
