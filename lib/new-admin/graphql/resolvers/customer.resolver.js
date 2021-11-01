const anonymous = require('../../../constants').anonymousCustomer
const customers = require('../../../customers')
const filters = require('../../filters')

const resolvers = {
  // Upload: GraphQLUpload,

  Customer: {
    isAnonymous: parent => (parent.customerId === anonymous.uuid)
  },
  Query: {
    customers: (...[, { phone, name, address, id }]) => customers.getCustomersList(phone, name, address, id),
    customer: (...[, { customerId }]) => customers.getCustomerById(customerId),
    customerFilters: () => filters.customer()
  },
  Mutation: {
    setCustomer: (root, { customerId, customerInput }, context, info) => {
      const token = !!context.req.cookies.lamassu_sid && context.req.session.user.id
      if (customerId === anonymous.uuid) return customers.getCustomerById(customerId)
      return customers.updateCustomer(customerId, customerInput, token)
    },
    addCustomField: (...[, { customerId, label, value }]) => customers.addCustomField(customerId, label, value),
    saveCustomField: (...[, { customerId, fieldId, newValue }]) => customers.saveCustomField(customerId, fieldId, newValue),
    removeCustomField: (...[, [ { customerId, fieldId } ]]) => customers.removeCustomField(customerId, fieldId),
    editCustomer: (root, { customerId, customerEdit }, context) => {
      const token = !!context.req.cookies.lid && context.req.session.user.id
      return customers.edit(customerId, customerEdit, token)
    },
    deleteEditedData: (root, { customerId, customerEdit }) => {
      return customers.deleteEditedData(customerId, customerEdit)
    }
  }
}

module.exports = resolvers
