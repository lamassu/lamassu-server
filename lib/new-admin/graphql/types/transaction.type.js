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

  type Query {
    transactions(from: Date, until: Date, limit: Int, offset: Int, deviceId: ID): [Transaction]
    transactionsCsv(from: Date, until: Date, limit: Int, offset: Int): String
  }
`

module.exports = typeDef
