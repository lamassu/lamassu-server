const loyalty = require('../../../loyalty')

const resolvers = {
  Query: {
    promoCodes: () => loyalty.getAvailablePromoCodes(),
    individualDiscounts: () => loyalty.getAvailableIndividualDiscounts()
  },
  Mutation: {
    createPromoCode: (...[, { code, discount }]) => loyalty.createPromoCode(code, discount),
    deletePromoCode: (...[, { codeId }]) => loyalty.deletePromoCode(codeId),
    createIndividualDiscount: (...[, { customerId, discount }]) => loyalty.createIndividualDiscount(customerId, discount),
    deleteIndividualDiscount: (...[, { discountId }]) => loyalty.deleteIndividualDiscount(discountId)
  }
}

module.exports = resolvers
