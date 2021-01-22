const anonymous = require('../../../constants').anonymousCustomer
const customers = require('../../../customers')

const resolvers = {
  Customer: {
    isAnonymous: parent => (parent.customerId === anonymous.uuid)
  },
  Query: {
    customers: () => customers.getCustomersList(),
    customer: (...[, { customerId }]) => customers.getCustomerById(customerId)
  },
  Mutation: {
    setCustomer: (root, { customerId, customerInput }, context, info) => {
      const token = context.req.cookies && context.req.cookies.token
      if (customerId === anonymous.uuid) return customers.getCustomerById(customerId)
      return customers.updateCustomer(customerId, customerInput, token)
    }
  }
}

module.exports = resolvers
