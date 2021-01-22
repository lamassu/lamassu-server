const { gql } = require('apollo-server-express')

const typeDef = gql`
  type CoinFunds {
    cryptoCode: String!
    errorMsg: String
    fundingAddress: String
    fundingAddressUrl: String
    confirmedBalance: String
    pending: String
    fiatConfirmedBalance: String
    fiatPending: String
    fiatCode: String
    display: String
    unitScale: String
  }

  type Query {
    funding: [CoinFunds]
  }
`

module.exports = typeDef
