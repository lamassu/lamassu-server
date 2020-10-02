const { gql } = require('apollo-server-express')
const { GraphQLDateTime } = require('graphql-iso-date')
const { GraphQLJSON, GraphQLJSONObject } = require('graphql-type-json')
const got = require('got')

const machineLoader = require('../../machine-loader')
const customers = require('../../customers')
const { machineAction } = require('../machines')
const logs = require('../../logs')
const supportLogs = require('../../support_logs')
const settingsLoader = require('../../new-settings-loader')

const serverVersion = require('../../../package.json').version

const transactions = require('../transactions')
const funding = require('../funding')
const supervisor = require('../supervisor')
const serverLogs = require('../server-logs')
const pairing = require('../pairing')
const { accounts: accountsConfig, coins, countries, currencies, languages } = require('../config')

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
    lastPing: Date
    pairedAt: Date
    version: String
    model: String
    cashbox: Int
    cassette1: Int
    cassette2: Int
    statuses: [MachineStatus]
  }

  type Customer {
    id: ID!
    name: String
    authorizedOverride: String
    frontCameraPath: String
    phone: String
    smsOverride: String
    idCardData: JSONObject
    idCardDataOverride: String
    idCardDataExpiration: Date
    idCardPhotoPath: String
    idCardPhotoOverride: String
    totalTxs: Int
    totalSpent: String
    lastActive: Date
    lastTxFiat: String
    lastTxFiatCode: String
    lastTxClass: String
    transactions: [Transaction]
  }

  input CustomerInput {
    name: String
    authorizedOverride: String
    frontCameraPath: String
    phone: String
    smsOverride: String
    idCardData: JSONObject
    idCardDataOverride: String
    idCardDataExpiration: Date
    idCardPhotoPath: String
    idCardPhotoOverride: String
    totalTxs: Int
    totalSpent: String
    lastActive: Date
    lastTxFiat: String
    lastTxFiatCode: String
    lastTxClass: String
  }

  type AccountConfig {
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
    errorMsg: String
    fundingAddress: String
    fundingAddressUrl: String
    confirmedBalance: String
    pending: String
    fiatConfirmedBalance: String
    fiatPending: String
    fiatCode: String
    display: String
    unitScale: String
  }

  type ProcessStatus {
    name: String!
    state: String!
    uptime: Int!
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
    dispense: Boolean
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
    accountsConfig: [AccountConfig]
    cryptoCurrencies: [CryptoCurrency]
    machines: [Machine]
    customers: [Customer]
    customer(customerId: ID!): Customer
    machineLogs(deviceId: ID!, from: Date, until: Date, limit: Int, offset: Int): [MachineLog]
    funding: [CoinFunds]
    serverVersion: String!
    uptime: [ProcessStatus]
    serverLogs(from: Date, until: Date, limit: Int, offset: Int): [ServerLog]
    transactions(from: Date, until: Date, limit: Int, offset: Int): [Transaction]
    accounts: JSONObject
    config: JSONObject
  }

  type SupportLogsResponse {
    id: ID!
    timestamp: Date!
    deviceId: ID
  }

  enum MachineAction {
    rename
    emptyCashInBills
    resetCashOutBills
    unpair
    reboot
    shutdown
    restartServices
  }

  type Mutation {
    machineAction(deviceId:ID!, action: MachineAction!, cassette1: Int, cassette2: Int, newName: String): Machine
    machineSupportLogs(deviceId: ID!): SupportLogsResponse
    serverSupportLogs: SupportLogsResponse
    setCustomer(customerId: ID!, customerInput: CustomerInput): Customer
    saveConfig(config: JSONObject): JSONObject
    createPairingTotem(name: String!): String
    saveAccounts(accounts: JSONObject): JSONObject
  }
`

const notify = () => got.post('http://localhost:3030/dbChange')
  .catch(e => console.error('Error: lamassu-server not responding'))

const resolvers = {
  JSON: GraphQLJSON,
  JSONObject: GraphQLJSONObject,
  Date: GraphQLDateTime,
  Customer: {
    transactions: parent => transactions.getCustomerTransactions(parent.id)
  },
  Query: {
    countries: () => countries,
    currencies: () => currencies,
    languages: () => languages,
    accountsConfig: () => accountsConfig,
    cryptoCurrencies: () => coins,
    machines: () => machineLoader.getMachineNames(),
    customers: () => customers.getCustomersList(),
    customer: (...[, { customerId }]) => customers.getCustomerById(customerId),
    funding: () => funding.getFunding(),
    machineLogs: (...[, { deviceId, from, until, limit, offset }]) => 
      logs.simpleGetMachineLogs(deviceId, from, until, limit, offset),
    serverVersion: () => serverVersion,
    uptime: () => supervisor.getAllProcessInfo(),
    serverLogs: (...[, { from, until, limit, offset }]) =>
      serverLogs.getServerLogs(from, until, limit, offset),
    transactions: (...[, { from, until, limit, offset }]) =>
      transactions.batch(from, until, limit, offset),
    config: () => settingsLoader.loadLatestConfigOrNone(),
    accounts: () => settingsLoader.loadAccounts()
  },
  Mutation: {
    machineAction: (...[, { deviceId, action, cassette1, cassette2, newName }]) => machineAction({ deviceId, action, cassette1, cassette2, newName }),
    machineSupportLogs: (...[, { deviceId }]) => supportLogs.insert(deviceId),
    createPairingTotem: (...[, { name }]) => pairing.totem(name),
    serverSupportLogs: () => serverLogs.insert(),
    saveAccounts: (...[, { accounts }]) => settingsLoader.saveAccounts(accounts),
    setCustomer: (...[, { customerId, customerInput } ]) => customers.updateCustomer(customerId, customerInput),
    saveConfig: (...[, { config }]) => settingsLoader.saveConfig(config)
      .then(it => {
        notify()
        return it
      })
  }
}

module.exports = { resolvers, typeDefs }
