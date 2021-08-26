const { gql } = require('apollo-server-express')
const { parseAsync } = require('json2csv')
const { GraphQLDateTime } = require('graphql-iso-date')
const { GraphQLJSON, GraphQLJSONObject } = require('graphql-type-json')
const got = require('got')
const DataLoader = require('dataloader')

const machineLoader = require('../../machine-loader')
const customers = require('../../customers')
const { machineAction } = require('../machines')
const logs = require('../../logs')
const settingsLoader = require('../../new-settings-loader')
// const tokenManager = require('../../token-manager')
const blacklist = require('../../blacklist')
const machineEventsByIdBatch = require('../../postgresql_interface').machineEventsByIdBatch
const promoCodeManager = require('../../promo-codes')
const notifierQueries = require('../../notifier/queries')
const bills = require('../bills')
const anonymous = require('../../constants').anonymousCustomer

const serverVersion = require('../../../package.json').version
const cashOutTx = require('../../cash-out/cash-out-tx')
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
    latestEvent: MachineEvent
    downloadSpeed: String
    responseTime: String
    packetLoss: String
  }

  type Customer {
    id: ID!
    authorizedOverride: String
    daysSuspended: Int
    isSuspended: Boolean
    frontCameraPath: String
    frontCameraOverride: String
    phone: String
    isAnonymous: Boolean
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
    suspendedUntil: Date
  }

  type AccountConfig {
    code: String!
    display: String!
    class: String!
    cryptos: [String]
    deprecated: Boolean
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

  type UserToken {
    token: String!
    name: String!
    created: Date!
    user_agent: String
    ip_address: String
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
    isAnonymous: Boolean
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

  type Bills {
    fiat: Int
    deviceId: ID
    created: Date
    cashbox: Int
  }

  type Query {
    countries: [Country]
    currencies: [Currency]
    languages: [Language]
    accountsConfig: [AccountConfig]
    cryptoCurrencies: [CryptoCurrency]
    machines: [Machine]
    machine(deviceId: ID!): Machine
    customers: [Customer]
    customer(customerId: ID!): Customer
    machineLogs(deviceId: ID!, from: Date, until: Date, limit: Int, offset: Int): [MachineLog]
    machineLogsCsv(deviceId: ID!, from: Date, until: Date, limit: Int, offset: Int): String
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
      deviceId: ID
    ): [Transaction]
    transactionsCsv(from: Date, until: Date, limit: Int, offset: Int, simplified: Boolean): String
    accounts: JSONObject
    config: JSONObject
    blacklist: [Blacklist]
    # userTokens: [UserToken]
    promoCodes: [PromoCode]
    cryptoRates: JSONObject
    fiatRates: [Rate]
    notifications: [Notification]
    alerts: [Notification]
    hasUnreadNotifications: Boolean
    bills: [Bills]
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
    machineAction(deviceId:ID!, action: MachineAction!, cashbox: Int, cassette1: Int, cassette2: Int, newName: String): Machine
    setCustomer(customerId: ID!, customerInput: CustomerInput): Customer
    saveConfig(config: JSONObject): JSONObject
    # resetConfig(schemaVersion: Int): JSONObject
    createPairingTotem(name: String!): String
    saveAccounts(accounts: JSONObject): JSONObject
    # resetAccounts(schemaVersion: Int): JSONObject
    # migrateConfigAndAccounts: JSONObject
    # revokeToken(token: String!): UserToken
    deleteBlacklistRow(cryptoCode: String!, address: String!): Blacklist
    insertBlacklistRow(cryptoCode: String!, address: String!): Blacklist
    createPromoCode(code: String!, discount: Int!): PromoCode
    deletePromoCode(codeId: ID!): PromoCode
    toggleClearNotification(id: ID!, read: Boolean!): Notification
    clearAllNotifications: Notification
    cancelCashOutTransaction(id: ID): Transaction
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
  Date: GraphQLDateTime,
  Customer: {
    transactions: parent => transactionsLoader.load(parent.id),
    isAnonymous: parent => (parent.id === anonymous.uuid)
  },
  Transaction: {
    isAnonymous: parent => (parent.customerId === anonymous.uuid)
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
    transactionsCsv: (...[, { from, until, limit, offset, simplified }]) =>
      transactions.batch(from, until, limit, offset, null, simplified).then(parseAsync),
    config: () => settingsLoader.loadLatestConfigOrNone(),
    accounts: () => settingsLoader.showAccounts(),
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
    bills: () => bills.getBills()
  },
  Mutation: {
    machineAction: (...[, { deviceId, action, cashbox, cassette1, cassette2, newName }]) => machineAction({ deviceId, action, cashbox, cassette1, cassette2, newName }),
    createPairingTotem: (...[, { name }]) => pairing.totem(name),
    saveAccounts: (...[, { accounts }]) => settingsLoader.saveAccounts(accounts),
    // resetAccounts: (...[, { schemaVersion }]) => settingsLoader.resetAccounts(schemaVersion),
    setCustomer: (root, { customerId, customerInput }, context, info) => {
      const token = context.req.cookies && context.req.cookies.token
      if (customerId === anonymous.uuid) return customers.getCustomerById(customerId)
      return customers.updateCustomer(customerId, customerInput, token)
    },
    saveConfig: (...[, { config }]) => settingsLoader.saveConfig(config)
      .then(it => {
        notify()
        return it
      }),
    // resetConfig: (...[, { schemaVersion }]) => settingsLoader.resetConfig(schemaVersion),
    // migrateConfigAndAccounts: () => settingsLoader.migrate(),
    deleteBlacklistRow: (...[, { cryptoCode, address }]) =>
      blacklist.deleteFromBlacklist(cryptoCode, address),
    insertBlacklistRow: (...[, { cryptoCode, address }]) =>
      blacklist.insertIntoBlacklist(cryptoCode, address),
    // revokeToken: (...[, { token }]) => tokenManager.revokeToken(token)
    createPromoCode: (...[, { code, discount }]) => promoCodeManager.createPromoCode(code, discount),
    deletePromoCode: (...[, { codeId }]) => promoCodeManager.deletePromoCode(codeId),
    toggleClearNotification: (...[, { id, read }]) => notifierQueries.setRead(id, read),
    clearAllNotifications: () => notifierQueries.markAllAsRead(),
    cancelCashOutTransaction: (...[, { id }]) => cashOutTx.cancel(id)
  }
}

module.exports = { resolvers, typeDefs }
