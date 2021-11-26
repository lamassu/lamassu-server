const anonymous = require('../../../constants').anonymousCustomer
const customers = require('../../../customers')
const filters = require('../../filters')

const resolvers = {

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
      // TODO: To be replaced by function that fetchs the token
      const token = !!context.req.cookies.lamassu_sid && context.req.session.user.id
      if (customerId === anonymous.uuid) return customers.getCustomerById(customerId)
      return customers.updateCustomer(customerId, customerInput, token)
    },
    addCustomField: (...[, { customerId, label, value }]) => customers.addCustomField(customerId, label, value),
    saveCustomField: (...[, { customerId, fieldId, newValue }]) => customers.saveCustomField(customerId, fieldId, newValue),
    removeCustomField: (...[, [ { customerId, fieldId } ]]) => customers.removeCustomField(customerId, fieldId),
    editCustomer: async (root, { customerId, customerEdit }, context) => {
      // TODO: To be replaced by function that fetchs the token
      const token = !!context.req.cookies.lid && context.req.session.user.id
      const editedData = await customerEdit
      return customers.edit(customerId, editedData, token)
    },
    replacePhoto: async (root, { customerId, photoType, newPhoto }, context) => {
      // TODO: To be replaced by function that fetchs the token
      const token = !!context.req.cookies.lid && context.req.session.user.id
      const photo = await newPhoto
      if (!photo) return customers.getCustomerById(customerId)
      return customers.updateEditedPhoto(customerId, photo, photoType)
        .then(newPatch => customers.edit(customerId, newPatch, token))
    },
    deleteEditedData: (root, { customerId, customerEdit }) => {
      // TODO: NOT IMPLEMENTING THIS FEATURE FOR THE CURRENT VERSION
      return customers.getCustomerById(customerId)
    }
  }
}

module.exports = resolvers
