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
    transactions: [Transaction]
    subscriberInfo: JSONObject
    phoneOverride: String
    customFields: [CustomerCustomField]
    customInfoRequests: [CustomRequestData]
    notes: [CustomerNote]
    isTestCustomer: Boolean
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
    customers(phone: String, name: String, address: String, id: String): [Customer] @auth(permissions: ["customer:read"])
    customer(customerId: ID!): Customer @auth(permissions: ["customer:read"])
    customerFilters: [Filter] @auth(permissions: ["customer:read"])
  }

  type Mutation {
    setCustomer(customerId: ID!, customerInput: CustomerInput): Customer @auth(permissions: ["customer:edit"])
    addCustomField(customerId: ID!, label: String!, value: String!): Boolean @auth(permissions: ["customer:edit"])
    saveCustomField(customerId: ID!, fieldId: ID!, value: String!): Boolean @auth(permissions: ["customer:edit"])
    removeCustomField(customerId: ID!, fieldId: ID!): Boolean @auth(permissions: ["customer:edit"])
    editCustomer(customerId: ID!, customerEdit: CustomerEdit): Customer @auth(permissions: ["customer:edit"])
    deleteEditedData(customerId: ID!, customerEdit: CustomerEdit): Customer @auth(permissions: ["customer:edit"])
    replacePhoto(customerId: ID!, photoType: String, newPhoto: UploadGQL): Customer @auth(permissions: ["customer:edit"])
    createCustomerNote(customerId: ID!, title: String!, content: String!): Boolean @auth(permissions: ["customer:edit"])
    editCustomerNote(noteId: ID!, newContent: String!): Boolean @auth(permissions: ["customer:edit"])
    deleteCustomerNote(noteId: ID!): Boolean @auth(permissions: ["customer:edit"])
    createCustomer(phoneNumber: String): Customer @auth(permissions: ["customer:write"])
    enableTestCustomer(customerId: ID!): Boolean @auth(permissions: ["customer:edit"])
    disableTestCustomer(customerId: ID!): Boolean @auth(permissions: ["customer:edit"])
  }
`

module.exports = typeDef
