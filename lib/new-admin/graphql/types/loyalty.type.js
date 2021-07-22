const { gql } = require('apollo-server-express')

const typeDef = gql`
  type IndividualDiscount {
    id: ID!
    identificationType: DiscountIdentificationType
    value: String!
    discount: Int
  }

  enum DiscountIdentificationType {
    phone
    idCard
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
    createIndividualDiscount(identificationType: DiscountIdentificationType!, value: String!, discount: Int!): IndividualDiscount @auth
    deleteIndividualDiscount(discountId: ID!): IndividualDiscount @auth
  }
`

module.exports = typeDef
