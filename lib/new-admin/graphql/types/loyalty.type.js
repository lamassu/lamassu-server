const { gql } = require('apollo-server-express')

const typeDef = gql`
  type IndividualDiscount {
    id: ID!
    customerId: ID!
    discount: Int
  }

  type IndividualDiscountWithCustomerData {
    id: ID!
    discount: Int
    phone: String
    idCardData: JSONObject
  }

  type PromoCode {
    id: ID!
    code: String!
    discount: Int
  }

  type Query {
    promoCodes: [PromoCode] @auth
    individualDiscounts: [IndividualDiscount] @auth
    individualDiscountsWithCustomerData: [IndividualDiscountWithCustomerData] @auth
  }

  type Mutation {
    createPromoCode(code: String!, discount: Int!): PromoCode @auth
    deletePromoCode(codeId: ID!): PromoCode @auth
    createIndividualDiscount(customerId: ID!, discount: Int!): IndividualDiscount @auth
    deleteIndividualDiscount(discountId: ID!): IndividualDiscount @auth
  }
`

module.exports = typeDef
