const { gql } = require('apollo-server-express')

const typeDef = gql`

  type CustomInfoRequest {
    id: ID!,
    enabled: Boolean,
    customRequest: JSON
  }

  input CustomRequestInputField {
    choiceList: [String]
    constraintType: String
    type: String
    numDigits: String
    label1: String
    label2: String
  }

  input CustomRequestInputScreen {
    text: String
    title: String
  }

  input CustomRequestInput {
    name: String
    input: CustomRequestInputField
    screen1: CustomRequestInputScreen
    screen2: CustomRequestInputScreen
  }

  type CustomRequestData {
    customerId: ID
    infoRequestId: ID
    approved: Boolean
    customerData: JSON
    customInfoRequest: CustomInfoRequest
  }

  type Query {
    customInfoRequests(onlyEnabled: Boolean): [CustomInfoRequest] @auth
    customerCustomInfoRequests(customerId: ID!): [CustomRequestData] @auth
    customerCustomInfoRequest(customerId: ID!, infoRequestId: ID!): CustomRequestData @auth
  }

  type Mutation {
    insertCustomInfoRequest(customRequest: CustomRequestInput!): CustomInfoRequest @auth
    removeCustomInfoRequest(id: ID!): CustomInfoRequest @auth
    editCustomInfoRequest(id: ID!, customRequest: CustomRequestInput!): CustomInfoRequest @auth
    setAuthorizedCustomRequest(customerId: ID!, infoRequestId: ID!, isAuthorized: Boolean!): Boolean @auth
  }
`

module.exports = typeDef
