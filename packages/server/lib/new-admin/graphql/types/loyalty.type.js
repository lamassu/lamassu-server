const { gql } = require('apollo-server-express')

const typeDef = gql`
  type IndividualDiscount {
    id: ID!
    customerId: ID!
    discount: Int
  }

  type PromoCode {
    id: ID!
    code: String!
    discount: Int
  }

  type Query {
    promoCodes: [PromoCode] @auth
    individualDiscounts: [IndividualDiscount] @auth
  }

  type Mutation {
    createPromoCode(code: String!, discount: Int!): PromoCode @auth
    deletePromoCode(codeId: ID!): PromoCode @auth
    createIndividualDiscount(customerId: ID!, discount: Int!): IndividualDiscount @auth
    deleteIndividualDiscount(discountId: ID!): IndividualDiscount @auth
  }
`

module.exports = typeDef
