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
    override: String
    overrideAt: Date
    overrideBy: ID
    customerData: JSON
    customInfoRequest: CustomInfoRequest
  }

  type Query {
    customInfoRequests(onlyEnabled: Boolean): [CustomInfoRequest] @auth(permissions: ["customInfoRequests:read"])
    customerCustomInfoRequests(customerId: ID!): [CustomRequestData] @auth(permissions: ["customInfoRequests:read"])
    customerCustomInfoRequest(customerId: ID!, infoRequestId: ID!): CustomRequestData @auth(permissions: ["customInfoRequests:read"])
  }

  type Mutation {
    insertCustomInfoRequest(customRequest: CustomRequestInput!): CustomInfoRequest @auth(permissions: ["customInfoRequests:create"])
    removeCustomInfoRequest(id: ID!): CustomInfoRequest @auth(permissions: ["customInfoRequests:create"])
    editCustomInfoRequest(id: ID!, customRequest: CustomRequestInput!): CustomInfoRequest @auth(permissions: ["customInfoRequests:update"])
    setAuthorizedCustomRequest(customerId: ID!, infoRequestId: ID!, override: String!): Boolean @auth(permissions: ["customInfoRequests:update"])
    setCustomerCustomInfoRequest(customerId: ID!, infoRequestId: ID!, data: JSON!): Boolean @auth(permissions: ["customInfoRequests:update"])
  }
`

module.exports = typeDef
