const { gql } = require('apollo-server-express')

const typeDef = gql`
  type Customer {
    id: ID!
    authorizedOverride: String
    daysSuspended: Int
    isSuspended: Boolean
    newPhoto: UploadGQL
    photoType: String
    frontCameraPath: String
    frontCameraAt: Date
    frontCameraOverride: String
    phone: String
    email: String
    isAnonymous: Boolean
    smsOverride: String
    idCardData: JSONObject
    idCardDataOverride: String
    idCardDataExpiration: Date
    idCardPhoto: UploadGQL
    idCardPhotoPath: String
    idCardPhotoOverride: String
    idCardPhotoAt: Date
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
    lastUsedMachine: String
    lastUsedMachineName: String
    transactions: [Transaction]
    subscriberInfo: JSONObject
    phoneOverride: String
    customFields: [CustomerCustomField]
    customInfoRequests: [CustomRequestData]
    notes: [CustomerNote]
    isTestCustomer: Boolean
    externalCompliance: [JSONObject]
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
    subscriberInfo: Boolean
    phoneOverride: String
  }

  input CustomerEdit {
    idCardData: JSONObject
    idCardPhoto: UploadGQL
    usSsn: String
    subscriberInfo: JSONObject
  }

  type CustomerNote {
    id: ID
    customerId: ID
    created: Date
    lastEditedAt: Date
    lastEditedBy: ID
    title: String
    content: String
  }

  type CustomerCustomField {
    id: ID
    label: String
    value: String
  }

  type Query {
    customers(phone: String, name: String, email: String, address: String, id: String): [Customer] @auth
    customer(customerId: ID!): Customer @auth
    customerFilters: [Filter] @auth
  }

  type Mutation {
    setCustomer(customerId: ID!, customerInput: CustomerInput): Customer @auth
    addCustomField(customerId: ID!, label: String!, value: String!): Boolean @auth
    saveCustomField(customerId: ID!, fieldId: ID!, value: String!): Boolean @auth
    removeCustomField(customerId: ID!, fieldId: ID!): Boolean @auth
    editCustomer(customerId: ID!, customerEdit: CustomerEdit): Customer @auth
    deleteEditedData(customerId: ID!, customerEdit: CustomerEdit): Customer @auth
    replacePhoto(customerId: ID!, photoType: String, newPhoto: UploadGQL): Customer @auth
    createCustomerNote(customerId: ID!, title: String!, content: String!): Boolean @auth
    editCustomerNote(noteId: ID!, newContent: String!): Boolean @auth
    deleteCustomerNote(noteId: ID!): Boolean @auth
    createCustomer(phoneNumber: String): Customer @auth
    enableTestCustomer(customerId: ID!): Boolean @auth
    disableTestCustomer(customerId: ID!): Boolean @auth
  }
`

module.exports = typeDef
