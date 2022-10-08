const sanctions = require('../../../sanctions')
const authentication = require('../modules/userManagement')

const resolvers = {
  Query: {
    checkAgainstSanctions: (...[, { customerId }, context]) => {
      const token = authentication.getToken(context)
      return sanctions.checkByUser(customerId, token)
    }
  }
}

module.exports = resolvers
