const { gql, SchemaDirectiveVisitor, AuthenticationError } = require('apollo-server-express')
const { parseAsync } = require('json2csv')
const { GraphQLDateTime } = require('graphql-iso-date')
const { GraphQLJSON, GraphQLJSONObject } = require('graphql-type-json')
const { defaultFieldResolver } = require('graphql')
const got = require('got')
const DataLoader = require('dataloader')

const machineLoader = require('../../machine-loader')
const customers = require('../../customers')
const { machineAction } = require('../machines')
const logs = require('../../logs')
const settingsLoader = require('../../new-settings-loader')
const sessionManager = require('../../session-manager')
const blacklist = require('../../blacklist')
const users = require('../../users')

const serverVersion = require('../../../package.json').version

const transactions = require('../transactions')
const funding = require('../funding')
const supervisor = require('../supervisor')
const serverLogs = require('../server-logs')
const pairing = require('../pairing')
const {
  accounts: accountsConfig,
  coins,
  countries,
  currencies,
  languages
} = require('../config')

class AuthDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition (field) {
    const { resolve = defaultFieldResolver } = field

    field.resolve = function (root, args, context, info) {
      if (!context.req.session.user) throw new AuthenticationError('You must be authenticated to access this resource!')
      return resolve.apply(this, [root, args, context, info])
    }
  }
}

class SuperuserDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition (field) {
    const { resolve = defaultFieldResolver } = field

    field.resolve = function (root, args, context, info) {
      if (context.req.session.user.role !== 'superuser') throw new AuthenticationError('You must be a superuser to access this resource!')
      return resolve.apply(this, [root, args, context, info])
    }
  }
}

const typeDefs = gql`
  directive @auth on FIELD_DEFINITION
  directive @superuser on FIELD_DEFINITION

  scalar JSON
  scalar JSONObject
  scalar DateTime

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
    lastPing: DateTime
    pairedAt: DateTime
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
    idCardDataExpiration: DateTime
    idCardPhotoPath: String
    idCardPhotoOverride: String
    usSsn: String
    usSsnOverride: String
    sanctions: Boolean
    sanctionsAt: DateTime
    sanctionsOverride: String
    totalTxs: Int
    totalSpent: String
    lastActive: DateTime
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
    idCardDataExpiration: DateTime
    idCardPhotoPath: String
    idCardPhotoOverride: String
    usSsn: String
    usSsnOverride: String
    sanctions: Boolean
    sanctionsAt: DateTime
    sanctionsOverride: String
    totalTxs: Int
    totalSpent: String
    lastActive: DateTime
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
    timestamp: DateTime!
    message: String!
  }

  type ServerLog {
    id: ID!
    logLevel: String!
    timestamp: DateTime!
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

  type UserToken {
    token: String!
    name: String!
    created: DateTime!
    user_agent: String
    ip_address: String
    last_accessed: DateTime
  }

  type UserSession {
    sid: String!
    sess: JSONObject!
    expire: DateTime!
  }

  type User {
    id: ID!
    username: String!
    password: String!
    role: String!
    enabled: Boolean!
    created: DateTime!
    last_accessed: DateTime!
    last_accessed_from: String
    last_accessed_address: String
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
    created: DateTime
    send: Boolean
    sendConfirmed: Boolean
    dispense: Boolean
    timedout: Boolean
    sendTime: DateTime
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
    customerIdCardDataExpiration: DateTime
    customerIdCardData: JSONObject
    customerName: String
    customerFrontCameraPath: String
    customerIdCardPhotoPath: String
    expired: Boolean
    machineName: String
  }

  type Blacklist {
    createdByOperator: Boolean!
    cryptoCode: String!
    address: String!
  }

  type Query {
    countries: [Country] @auth
    currencies: [Currency] @auth
    languages: [Language] @auth
    accountsConfig: [AccountConfig] @auth
    cryptoCurrencies: [CryptoCurrency] @auth
    machines: [Machine] @auth
    customers: [Customer] @auth
    customer(customerId: ID!): Customer @auth
    machineLogs(deviceId: ID!, from: DateTime, until: DateTime, limit: Int, offset: Int): [MachineLog] @auth
    machineLogsCsv(deviceId: ID!, from: DateTime, until: DateTime, limit: Int, offset: Int): String @auth
    funding: [CoinFunds] @auth
    serverVersion: String! @auth
    uptime: [ProcessStatus] @auth
    serverLogs(from: DateTime, until: DateTime, limit: Int, offset: Int): [ServerLog] @auth
    serverLogsCsv(from: DateTime, until: DateTime, limit: Int, offset: Int): String @auth
    transactions(from: DateTime, until: DateTime, limit: Int, offset: Int): [Transaction] @auth
    transactionsCsv(from: DateTime, until: DateTime, limit: Int, offset: Int): String @auth
    accounts: JSONObject @auth
    config: JSONObject @auth
    blacklist: [Blacklist] @auth
    userTokens: [UserToken] @auth @superuser
    users: [User] @auth @superuser
    sessions: [UserSession] @auth @superuser
    userSessions(username: String!): [UserSession] @auth @superuser
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
    machineAction(deviceId:ID!, action: MachineAction!, cassette1: Int, cassette2: Int, newName: String): Machine @auth
    setCustomer(customerId: ID!, customerInput: CustomerInput): Customer @auth
    saveConfig(config: JSONObject): JSONObject @auth
    createPairingTotem(name: String!): String @auth
    saveAccounts(accounts: JSONObject): JSONObject @auth
    revokeToken(token: String!): UserToken @auth @superuser
    deleteBlacklistRow(cryptoCode: String!, address: String!): Blacklist @auth
    insertBlacklistRow(cryptoCode: String!, address: String!): Blacklist @auth
    revokeUserTokens(name: String!): [UserToken] @auth @superuser
    deleteUser(id: ID!): User @auth @superuser
    deleteSession(sid: String!): UserSession @auth @superuser
    deleteUserSessions(username: String!): [UserSession] @auth @superuser
    changeUserRole(id: ID!, newRole: String!): User @auth @superuser
    toggleUserEnable(id: ID!): User @auth @superuser
  }
`

const transactionsLoader = new DataLoader(ids => transactions.getCustomerTransactionsBatch(ids))

const notify = () => got.post('http://localhost:3030/dbChange')
  .catch(e => console.error('Error: lamassu-server not responding'))

const resolvers = {
  JSON: GraphQLJSON,
  JSONObject: GraphQLJSONObject,
  DateTime: GraphQLDateTime,
  Customer: {
    transactions: parent => transactionsLoader.load(parent.id)
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
      logs.simpleGetMachineLogs(deviceId, from, until, limit, offset).then(parseAsync),
    serverVersion: () => serverVersion,
    uptime: () => supervisor.getAllProcessInfo(),
    serverLogs: (...[, { from, until, limit, offset }]) =>
      serverLogs.getServerLogs(from, until, limit, offset),
    serverLogsCsv: (...[, { from, until, limit, offset }]) =>
      serverLogs.getServerLogs(from, until, limit, offset).then(parseAsync),
    transactions: (...[, { from, until, limit, offset }]) =>
      transactions.batch(from, until, limit, offset),
    transactionsCsv: (...[, { from, until, limit, offset }]) =>
      transactions.batch(from, until, limit, offset).then(parseAsync),
    config: () => settingsLoader.loadLatestConfigOrNone(),
    accounts: () => settingsLoader.loadAccounts(),
    blacklist: () => blacklist.getBlacklist(),
    users: () => users.getUsers(),
    sessions: () => sessionManager.getSessionList(),
    userSessions: (...[, { username }]) => sessionManager.getUserSessions(username)
  },
  Mutation: {
    machineAction: (...[, { deviceId, action, cassette1, cassette2, newName }]) => machineAction({ deviceId, action, cassette1, cassette2, newName }),
    createPairingTotem: (...[, { name }]) => pairing.totem(name),
    saveAccounts: (...[, { accounts }]) => settingsLoader.saveAccounts(accounts),
    setCustomer: (root, args, context, info) => {
      const token = context.req.session.user.id
      return customers.updateCustomer(args.customerId, args.customerInput, token)
    },
    saveConfig: (...[, { config }]) => settingsLoader.saveConfig(config)
      .then(it => {
        notify()
        return it
      }),
    deleteBlacklistRow: (...[, { cryptoCode, address }]) =>
      blacklist.deleteFromBlacklist(cryptoCode, address),
    insertBlacklistRow: (...[, { cryptoCode, address }]) =>
      blacklist.insertIntoBlacklist(cryptoCode, address),
    deleteUser: (...[, { id }]) => users.deleteUser(id),
    deleteSession: (root, args, context, info) => {
      if (args.sid === context.req.session.id) {
        context.req.session.destroy()
      }
      return sessionManager.deleteSession(args.sid)
    },
    deleteUserSessions: (root, args, context, info) => {
      return sessionManager.deleteUserSessions(args.username)
    },
    changeUserRole: (...[, { id, newRole }]) => users.changeUserRole(id, newRole),
    toggleUserEnable: (...[, { id }]) => users.toggleUserEnable(id)
  }
}

module.exports = { resolvers, typeDefs, AuthDirective, SuperuserDirective }
