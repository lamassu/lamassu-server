const { gql } = require('apollo-server-express')

const typeDef = gql`
  type PromoCode {
    id: ID!
    code: String!
    discount: Int
  }

  type Query {
    promoCodes: [PromoCode]
  }

  type Mutation {
    createPromoCode(code: String!, discount: Int!): PromoCode
    deletePromoCode(codeId: ID!): PromoCode
  }
`

module.exports = typeDef
