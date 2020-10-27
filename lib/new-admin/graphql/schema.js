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
// const tokenManager = require('../../token-manager')
const blacklist = require('../../blacklist')
<<<<<<< HEAD
const machineEventsByIdBatch = require('../../postgresql_interface').machineEventsByIdBatch
const promoCodeManager = require('../../promo-codes')
const notifierQueries = require('../../notifier/queries')
=======
const machineEventsByIdBatch = require("../../postgresql_interface").machineEventsByIdBatch
const couponManager = require('../../coupons')
const sessionManager = require('../../session-manager')
const users = require('../../users')
>>>>>>> feat: add user management screen

const serverVersion = require('../../../package.json').version
const transactions = require('../transactions')
const funding = require('../funding')
const forex = require('../../forex')
const supervisor = require('../supervisor')
const serverLogs = require('../server-logs')
const pairing = require('../pairing')
const plugins = require('../../plugins')

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
    latestEvent: MachineEvent
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

  type PromoCode {
    id: ID!
    code: String!
    discount: Int!
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
    discount: Int
  }

  type Blacklist {
    createdByOperator: Boolean!
    cryptoCode: String!
    address: String!
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

  type Rate {
    code: String
    name: String
    rate: Float
  }

  type Notification {
    id: ID!
    type: String
    detail: JSON
    message: String
    created: Date
    read: Boolean
    valid: Boolean
  }

  type Query {
    countries: [Country] @auth
    currencies: [Currency] @auth
    languages: [Language] @auth
    accountsConfig: [AccountConfig] @auth
    cryptoCurrencies: [CryptoCurrency] @auth
    machines: [Machine] @auth
    machine(deviceId: ID!): Machine @auth
    customers: [Customer] @auth
    customer(customerId: ID!): Customer @auth
    machineLogs(deviceId: ID!, from: Date, until: Date, limit: Int, offset: Int): [MachineLog] @auth
    machineLogsCsv(deviceId: ID!, from: Date, until: Date, limit: Int, offset: Int): String @auth
    funding: [CoinFunds] @auth
    serverVersion: String! @auth
    uptime: [ProcessStatus] @auth
    serverLogs(from: Date, until: Date, limit: Int, offset: Int): [ServerLog] @auth
    serverLogsCsv(from: Date, until: Date, limit: Int, offset: Int): String @auth
    transactions(
      from: Date
      until: Date
      limit: Int
      offset: Int
      deviceId: ID
    ): [Transaction] @auth
    transactionsCsv(from: Date, until: Date, limit: Int, offset: Int): String @auth
    accounts: JSONObject @auth
    config: JSONObject @auth
    blacklist: [Blacklist] @auth
    # userTokens: [UserToken]
<<<<<<< HEAD
    promoCodes: [PromoCode]
    cryptoRates: JSONObject
    fiatRates: [Rate]
    notifications: [Notification]
    alerts: [Notification]
    hasUnreadNotifications: Boolean
=======
    coupons: [Coupon] @auth
    cryptoRates: JSONObject @auth
    fiatRates: [Rate] @auth
    userTokens: [UserToken] @auth @superuser
    users: [User] @auth @superuser
    sessions: [UserSession] @auth @superuser
    userSessions(username: String!): [UserSession] @auth @superuser
>>>>>>> feat: add user management screen
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
    setCassetteBills
    unpair
    reboot
    shutdown
    restartServices
  }

  type Mutation {
    machineAction(deviceId:ID!, action: MachineAction!, cassette1: Int, cassette2: Int, newName: String): Machine @auth
    setCustomer(customerId: ID!, customerInput: CustomerInput): Customer @auth
    saveConfig(config: JSONObject): JSONObject @auth
    resetConfig(schemaVersion: Int): JSONObject @auth
    createPairingTotem(name: String!): String @auth
    saveAccounts(accounts: JSONObject): JSONObject @auth
    resetAccounts(schemaVersion: Int): JSONObject @auth
    migrateConfigAndAccounts: JSONObject @auth
    revokeToken(token: String!): UserToken @auth @superuser
    deleteBlacklistRow(cryptoCode: String!, address: String!): Blacklist @auth
    insertBlacklistRow(cryptoCode: String!, address: String!): Blacklist @auth
    createPromoCode(code: String!, discount: Int!): PromoCode @auth
    deletePromoCode(codeId: ID!): PromoCode @auth
    clearNotification(id: ID!): Notification @auth
    clearAllNotifications: Notification @auth
    revokeUserTokens(name: String!): [UserToken] @auth @superuser
    deleteUser(id: ID!): User @auth @superuser
    deleteSession(sid: String!): UserSession @auth @superuser
    deleteUserSessions(username: String!): [UserSession] @auth @superuser
    changeUserRole(id: ID!, newRole: String!): User @auth @superuser
    toggleUserEnable(id: ID!): User @auth @superuser
  }
`

const transactionsLoader = new DataLoader(ids => transactions.getCustomerTransactionsBatch(ids))
const machineEventsLoader = new DataLoader(ids => {
  return machineEventsByIdBatch(ids)
}, { cache: false })

const notify = () => got.post('http://localhost:3030/dbChange')
  .catch(e => console.error('Error: lamassu-server not responding'))

const resolvers = {
  JSON: GraphQLJSON,
  JSONObject: GraphQLJSONObject,
  DateTime: GraphQLDateTime,
  Customer: {
    transactions: parent => transactionsLoader.load(parent.id)
  },
  Machine: {
    latestEvent: parent => machineEventsLoader.load(parent.deviceId)
  },
  Query: {
    countries: () => countries,
    currencies: () => currencies,
    languages: () => languages,
    accountsConfig: () => accountsConfig,
    cryptoCurrencies: () => coins,
    machines: () => machineLoader.getMachineNames(),
    machine: (...[, { deviceId }]) => machineLoader.getMachine(deviceId),
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
    transactions: (...[, { from, until, limit, offset, deviceId }]) =>
      transactions.batch(from, until, limit, offset, deviceId),
    transactionsCsv: (...[, { from, until, limit, offset }]) =>
      transactions.batch(from, until, limit, offset).then(parseAsync),
    config: () => settingsLoader.loadLatestConfigOrNone(),
    accounts: () => settingsLoader.loadAccounts(),
    blacklist: () => blacklist.getBlacklist(),
    // userTokens: () => tokenManager.getTokenList()
    promoCodes: () => promoCodeManager.getAvailablePromoCodes(),
    cryptoRates: () =>
      settingsLoader.loadLatest().then(settings => {
        const pi = plugins(settings)
        return pi.getRawRates().then(r => {
          return {
            withCommissions: pi.buildRates(r),
            withoutCommissions: pi.buildRatesNoCommission(r)
          }
        })
      }),
    fiatRates: () => forex.getFiatRates(),
    notifications: () => notifierQueries.getNotifications(),
    hasUnreadNotifications: () => notifierQueries.hasUnreadNotifications(),
    alerts: () => notifierQueries.getAlerts(),
    users: () => users.getUsers(),
    sessions: () => sessionManager.getSessionList(),
    userSessions: (...[, { username }]) => sessionManager.getUserSessions(username)
  },
  Mutation: {
    machineAction: (...[, { deviceId, action, cashbox, cassette1, cassette2, newName }]) => machineAction({ deviceId, action, cashbox, cassette1, cassette2, newName }),
    createPairingTotem: (...[, { name }]) => pairing.totem(name),
    saveAccounts: (...[, { accounts }]) => settingsLoader.saveAccounts(accounts),
    resetAccounts: (...[, { schemaVersion }]) => settingsLoader.resetAccounts(schemaVersion),
    setCustomer: (root, args, context, info) => {
      const token = context.req.session.user.id
      return customers.updateCustomer(args.customerId, args.customerInput, token)
    },
    saveConfig: (...[, { config }]) => settingsLoader.saveConfig(config)
      .then(it => {
        notify()
        return it
      }),
    resetConfig: (...[, { schemaVersion }]) => settingsLoader.resetConfig(schemaVersion),
    migrateConfigAndAccounts: () => settingsLoader.migrate(),
    deleteBlacklistRow: (...[, { cryptoCode, address }]) =>
      blacklist.deleteFromBlacklist(cryptoCode, address),
    insertBlacklistRow: (...[, { cryptoCode, address }]) =>
      blacklist.insertIntoBlacklist(cryptoCode, address),
    // revokeToken: (...[, { token }]) => tokenManager.revokeToken(token)
    createPromoCode: (...[, { code, discount }]) => promoCodeManager.createPromoCode(code, discount),
    deletePromoCode: (...[, { codeId }]) => promoCodeManager.deletePromoCode(codeId),
    clearNotification: (...[, { id }]) => notifierQueries.markAsRead(id),
    clearAllNotifications: () => notifierQueries.markAllAsRead(),
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
