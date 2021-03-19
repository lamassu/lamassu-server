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
    countries: [Country]
    languages: [Language]
    accountsConfig: [AccountConfig]
  }
`

module.exports = typeDef
