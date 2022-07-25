const { gql } = require('apollo-server-express')

const typeDef = gql`
  type SMSNotice {
    id: ID!
    event: SMSNoticeEvent!
    message: String!
    messageName: String!
    enabled: Boolean!
    allowToggle: Boolean!
  }

  enum SMSNoticeEvent {
    smsCode
    cashOutDispenseReady
    smsReceipt
  }

  type Query {
    SMSNotices: [SMSNotice] @auth(permissions: ["smsNotices:read"])
  }

  type Mutation {
    editSMSNotice(id: ID!, event: SMSNoticeEvent!, message: String!): SMSNotice @auth(permissions: ["smsNotices:edit"])
    enableSMSNotice(id: ID!): SMSNotice @auth(permissions: ["smsNotices:edit"])
    disableSMSNotice(id: ID!): SMSNotice @auth(permissions: ["smsNotices:edit"])
  }
`

module.exports = typeDef
