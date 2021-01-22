const promoCodeManager = require('../../../promo-codes')

const resolvers = {
  Query: {
    promoCodes: () => promoCodeManager.getAvailablePromoCodes()
  },
  Mutation: {
    createPromoCode: (...[, { code, discount }]) => promoCodeManager.createPromoCode(code, discount),
    deletePromoCode: (...[, { codeId }]) => promoCodeManager.deletePromoCode(codeId)
  }
}

module.exports = resolvers
