const { gql } = require('apollo-server-express')

const typeDef = gql`
  type Currency {
    code: String!
    display: String!
  }

  type CryptoCurrency {
    code: String!
    display: String!
  }

  type Query {
    currencies: [Currency] @auth(permissions: ["currencies:read"])
    cryptoCurrencies: [CryptoCurrency] @auth(permissions: ["cryptocurrencies:read"])
  }
`

module.exports = typeDef
