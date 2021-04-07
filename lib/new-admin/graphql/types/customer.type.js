const { gql } = require('apollo-server-express')

const typeDef = gql`
  type Customer {
    id: ID!
    authorizedOverride: String
    daysSuspended: Int
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
  }

  type Query {
    customers: [Customer] @auth
    customer(customerId: ID!): Customer @auth
  }

  type Mutation {
    setCustomer(customerId: ID!, customerInput: CustomerInput): Customer @auth
  }
`

module.exports = typeDef
