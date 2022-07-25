const { gql } = require('apollo-server-express')

const typeDef = gql`
  type Country {
    code: String!
    display: String!
  }

  type Language {
    code: String!
    display: String!
  }

  type AccountConfig {
    code: String!
    display: String!
    class: String!
    cryptos: [String]
    deprecated: Boolean
  }

  type Query {
    countries: [Country] @auth(permissions: ["config:read"])
    languages: [Language] @auth(permissions: ["config:read"])
    accountsConfig: [AccountConfig] @auth(permissions: ["config:read"])
  }
`

module.exports = typeDef
