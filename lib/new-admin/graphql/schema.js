const { gql } = require('apollo-server-express')
const { GraphQLDateTime } = require('graphql-iso-date')
const { GraphQLJSON, GraphQLJSONObject } = require('graphql-type-json')
const got = require('got')

const machineLoader = require('../../machine-loader')
const logs = require('../../logs')
const supportLogs = require('../../support_logs')
const settingsLoader = require('../../new-settings-loader')

const serverVersion = require('../../../package.json').version

const transactions = require('../transactions')
const funding = require('../funding')
const supervisor = require('../supervisor')
const serverLogs = require('../server-logs')
const { accounts, coins, countries, currencies, languages } = require('../config')

// TODO why does server logs messages can be null?
const typeDefs = gql`
  scalar JSON
  scalar JSONObject
  scalar Date

  type Currency {
    code: String!
    display: String!
  }

  type CryptoCurrency {
    code: String!
    display: String!
  }

  type Country {
    code: String!
    display: String!
  }

  type Language {
    code: String!
    display: String!
  }

  type MachineStatus {
    label: String!
    type: String!
  }

  type Machine {
    name: String!
    deviceId: ID!
    paired: Boolean!
    cashbox: Int
    cassette1: Int
    cassette2: Int
    statuses: [MachineStatus]
  }

  type Account {
    code: String!
    display: String!
    class: String!
    cryptos: [String]
  }

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

  type CoinFunds {
    cryptoCode: String!
    fundingAddress: String!
    fundingAddressUrl: String!
    confirmedBalance: String!
    pending: String!
    fiatConfirmedBalance: String!
    fiatPending: String!
    fiatCode: String!
    display: String!
    unitScale: String!
  }

  type ProcessStatus {
    name: String!
    state: String!
    uptime: Date!
  }

  type Transaction {
    id: ID!
    txClass: String!
    deviceId: ID!
    toAddress: String
    cryptoAtoms: String!
    cryptoCode: String!
    fiat: String!
    fiatCode: String!
    fee: String
    txHash: String
    phone: String
    error: String
    created: Date
    send: Boolean
    sendConfirmed: Boolean
    timedout: Boolean
    sendTime: Date
    errorCode: String
    operatorCompleted: Boolean
    sendPending: Boolean
    cashInFee: String
    cashInFeeCrypto: String
    minimumTx: Float
    customerId: ID
    txVersion: Int!
    termsAccepted: Boolean
    commissionPercentage: String 
    rawTickerPrice: String
    isPaperWallet: Boolean
    customerPhone: String
    customerIdCardDataNumber: String
    customerIdCardDataExpiration: Date
    customerIdCardData: JSONObject
    customerName: String
    customerFrontCameraPath: String
    customerIdCardPhotoPath: String
    expired: Boolean
    machineName: String
  }

  type Query {
    countries: [Country]
    currencies: [Currency]
    languages: [Language]
    accounts: [Account]
    cryptoCurrencies: [CryptoCurrency]
    machines: [Machine]
    machineLogs(deviceId: ID!): [MachineLog]
    funding: [CoinFunds]
    serverVersion: String!
    uptime: [ProcessStatus]
    serverLogs: [ServerLog]
    transactions: [Transaction]
    config: JSONObject
  }

  type SupportLogsResponse {
    id: ID!
    timestamp: Date!
    deviceId: ID
  }

  type Mutation {
    machineSupportLogs(deviceId: ID!): SupportLogsResponse
    serverSupportLogs: SupportLogsResponse
    saveConfig(config: JSONObject): JSONObject
  }
`

const notify = () => got.post('http://localhost:3030/dbChange')
  .catch(e => console.error('Error: lamassu-server not responding'))

const resolvers = {
  JSON: GraphQLJSON,
  JSONObject: GraphQLJSONObject,
  Date: GraphQLDateTime,
  Query: {
    countries: () => countries,
    currencies: () => currencies,
    languages: () => languages,
    accounts: () => accounts,
    cryptoCurrencies: () => coins,
    machines: () => machineLoader.getMachineNames(),
    funding: () => funding.getFunding(),
    machineLogs: (...[, { deviceId }]) => logs.simpleGetMachineLogs(deviceId),
    serverVersion: () => serverVersion,
    uptime: () => supervisor.getAllProcessInfo(),
    serverLogs: () => serverLogs.getServerLogs(),
    transactions: () => transactions.batch(),
    config: () => settingsLoader.getConfig()
  },
  Mutation: {
    machineSupportLogs: (...[, { deviceId }]) => supportLogs.insert(deviceId),
    serverSupportLogs: () => serverLogs.insert(),
    saveConfig: (...[, { config }]) => settingsLoader.saveConfig(config)
      .then(it => {
        notify()
        return it
      })
  }
}

module.exports = { resolvers, typeDefs }
