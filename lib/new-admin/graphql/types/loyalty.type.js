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
    promoCodes: [PromoCode] @auth(permissions: ["promoCodes:read"])
    individualDiscounts: [IndividualDiscount] @auth(permissions: ["individualDiscounts:read"])
  }

  type Mutation {
    createPromoCode(code: String!, discount: Int!): PromoCode @auth(permissions: ["promoCodes:create"])
    deletePromoCode(codeId: ID!): PromoCode @auth(permissions: ["promoCodes:delete"])
    createIndividualDiscount(customerId: ID!, discount: Int!): IndividualDiscount @auth(permissions: ["individualDiscounts:create"])
    deleteIndividualDiscount(discountId: ID!): IndividualDiscount @auth(permissions: ["individualDiscounts:delete"])
  }
`

module.exports = typeDef
