const { gql } = require('apollo-server-express')

const typeDef = gql`
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

  type Filter {
    type: String
    value: String
  }

  type Query {
    transactions(from: Date, until: Date, limit: Int, offset: Int, deviceId: ID, txClass: String, machineName: String, customerName: String, fiatCode: String, cryptoCode: String, toAddress: String, status: String): [Transaction] @auth
    transactionsCsv(from: Date, until: Date, limit: Int, offset: Int, txClass: String, machineName: String, customerName: String, fiatCode: String, cryptoCode: String, toAddress: String, status: String): String @auth
    transactionCsv(id: ID, txClass: String): String @auth
    txAssociatedDataCsv(id: ID, txClass: String): String @auth
    transactionFilters: [Filter] @auth
  }
`

module.exports = typeDef
