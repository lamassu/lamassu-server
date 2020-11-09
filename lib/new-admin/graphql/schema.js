const { gql } = require('apollo-server-express')
const converter = require('json-2-csv')
const { GraphQLDateTime } = require('graphql-iso-date')
const { GraphQLJSON, GraphQLJSONObject } = require('graphql-type-json')
const got = require('got')

const machineLoader = require('../../machine-loader')
const customers = require('../../customers')
const { machineAction } = require('../machines')
const logs = require('../../logs')
const settingsLoader = require('../../new-settings-loader')

const serverVersion = require('../../../package.json').version
const transactions = require('../transactions')
const funding = require('../funding')
const supervisor = require('../supervisor')
const serverLogs = require('../server-logs')
const pairing = require('../pairing')

const plugins = require('../../plugins')
const ticker = require('../../ticker')

const {
  accounts: accountsConfig,
  coins,
  countries,
  currencies,
  languages
} = require('../config')

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
    authorizedOverride: String
    daysSuspended: Int
    frontCameraPath: String
    frontCameraOverride: String
    phone: String
    smsOverride: String
    idCardData: JSONObject
    idCardDataOverride: String
    idCardDataExpiration: Date
    idCardPhotoPath: String
    idCardPhotoOverride: String
    usSsn: String
    usSsnOverride: String
    sanctions: Boolean
    sanctionsAt: Date
    sanctionsOverride: String
    totalTxs: Int
    totalSpent: String
    lastActive: Date
    lastTxFiat: String
    lastTxFiatCode: String
    lastTxClass: String
    transactions: [Transaction]
  }

  input CustomerInput {
    authorizedOverride: String
    frontCameraPath: String
    frontCameraOverride: String
    phone: String
    smsOverride: String
    idCardData: JSONObject
    idCardDataOverride: String
    idCardDataExpiration: Date
    idCardPhotoPath: String
    idCardPhotoOverride: String
    usSsn: String
    usSsnOverride: String
    sanctions: Boolean
    sanctionsAt: Date
    sanctionsOverride: String
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

  type Rate {
    code: String
    name: String
    rate: Float
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
    machineLogs(
      deviceId: ID!
      from: Date
      until: Date
      limit: Int
      offset: Int
    ): [MachineLog]
    machineLogsCsv(
      deviceId: ID!
      from: Date
      until: Date
      limit: Int
      offset: Int
    ): String
    funding: [CoinFunds]
    serverVersion: String!
    uptime: [ProcessStatus]
    serverLogs(from: Date, until: Date, limit: Int, offset: Int): [ServerLog]
    serverLogsCsv(from: Date, until: Date, limit: Int, offset: Int): String
    transactions(
      from: Date
      until: Date
      limit: Int
      offset: Int
      id: String
    ): [Transaction]
    transactionsCsv(from: Date, until: Date, limit: Int, offset: Int): String
    accounts: JSONObject
    config: JSONObject
    rates: JSONObject
    btcRates(to: String, from: String): [Rate]
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
    machineAction(
      deviceId: ID!
      action: MachineAction!
      cassette1: Int
      cassette2: Int
      newName: String
    ): Machine
    setCustomer(customerId: ID!, customerInput: CustomerInput): Customer
    saveConfig(config: JSONObject): JSONObject
    createPairingTotem(name: String!): String
    saveAccounts(accounts: JSONObject): JSONObject
  }
`

const notify = () =>
  got
    .post('http://localhost:3030/dbChange')
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
    machineLogsCsv: (...[, { deviceId, from, until, limit, offset }]) =>
      logs
        .simpleGetMachineLogs(deviceId, from, until, limit, offset)
        .then(converter.json2csvAsync),
    serverVersion: () => serverVersion,
    uptime: () => supervisor.getAllProcessInfo(),
    serverLogs: (...[, { from, until, limit, offset }]) =>
      serverLogs.getServerLogs(from, until, limit, offset),
    serverLogsCsv: (...[, { from, until, limit, offset }]) =>
      serverLogs
        .getServerLogs(from, until, limit, offset)
        .then(converter.json2csvAsync),
    transactions: (...[, { from, until, limit, offset, id }]) =>
      transactions.batch(from, until, limit, offset, id),
    transactionsCsv: (...[, { from, until, limit, offset }]) =>
      transactions
        .batch(from, until, limit, offset)
        .then(converter.json2csvAsync),
    config: () => settingsLoader.loadLatestConfigOrNone(),
    accounts: () => settingsLoader.loadAccounts(),
    rates: () =>
      settingsLoader.loadLatest().then(settings => {
        const pi = plugins(settings)
        return pi.getRawRates().then(r => {
          return {
            withCommissions: { ...pi.buildRates(r) },
            withoutCommissions: { ...pi.buildRatesNoCommission(r) }
          }
        })
      }),
    btcRates: (...[, { to, from }]) => ticker.getBtcRates(to, from)
  },
  Mutation: {
    machineAction: (
      ...[, { deviceId, action, cassette1, cassette2, newName }]
    ) => machineAction({ deviceId, action, cassette1, cassette2, newName }),
    createPairingTotem: (...[, { name }]) => pairing.totem(name),
    saveAccounts: (...[, { accounts }]) =>
      settingsLoader.saveAccounts(accounts),
    setCustomer: (...[, { customerId, customerInput }]) =>
      customers.updateCustomer(customerId, customerInput),
    saveConfig: (...[, { config }]) =>
      settingsLoader.saveConfig(config).then(it => {
        notify()
        return it
      })
  }
}

module.exports = { resolvers, typeDefs }
