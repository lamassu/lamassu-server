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
    SMSNotices: [SMSNotice] @auth
  }

  type Mutation {
    editSMSNotice(id: ID!, event: SMSNoticeEvent!, message: String!): SMSNotice @auth
    enableSMSNotice(id: ID!): SMSNotice @auth
    disableSMSNotice(id: ID!): SMSNotice @auth
  }
`

module.exports = typeDef
