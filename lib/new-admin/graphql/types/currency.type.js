const { gql } = require('apollo-server-express')

const typeDef = gql`
  type Currency {
    code: String!
    display: String!
  }

  type CryptoCurrency {
    code: String!
    display: String!
    codeDisplay: String!
    isBeta: Boolean
  }

  type Query {
    currencies: [Currency] @auth
    cryptoCurrencies: [CryptoCurrency] @auth
  }
`

module.exports = typeDef
