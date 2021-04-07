const { gql } = require('apollo-server-express')

const typeDef = gql`
  type PromoCode {
    id: ID!
    code: String!
    discount: Int
  }

  type Query {
    promoCodes: [PromoCode] @auth
  }

  type Mutation {
    createPromoCode(code: String!, discount: Int!): PromoCode @auth
    deletePromoCode(codeId: ID!): PromoCode @auth
  }
`

module.exports = typeDef
