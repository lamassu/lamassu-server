const authentication = require('../modules/userManagement')
const anonymous = require('../../../constants').anonymousCustomer
const customers = require('../../../customers')
const filters = require('../../filters')
const customerNotes = require('../../../customer-notes')
const machineLoader = require('../../../machine-loader')

const addLastUsedMachineName = customer =>
  (customer.lastUsedMachine ? machineLoader.getMachineName(customer.lastUsedMachine) : Promise.resolve(null))
    .then(lastUsedMachineName => Object.assign(customer, { lastUsedMachineName }))

const resolvers = {
  Customer: {
    isAnonymous: parent => (parent.customerId === anonymous.uuid)
  },
  Query: {
    customers: (...[, { phone, email, name, address, id }]) => customers.getCustomersList(phone, name, address, id, email),
    customer: (...[, { customerId }]) => customers.getCustomerById(customerId).then(addLastUsedMachineName),
    customerFilters: () => filters.customer()
  },
  Mutation: {
    setCustomer: (root, { customerId, customerInput }, context, info) => {
      const token = authentication.getToken(context)
      if (customerId === anonymous.uuid) return customers.getCustomerById(customerId)
      return customers.updateCustomer(customerId, customerInput, token)
    },
    addCustomField: (...[, { customerId, label, value }]) => customers.addCustomField(customerId, label, value),
    saveCustomField: (...[, { customerId, fieldId, value }]) => customers.saveCustomField(customerId, fieldId, value),
    removeCustomField: (...[, [ { customerId, fieldId } ]]) => customers.removeCustomField(customerId, fieldId),
    editCustomer: async (root, { customerId, customerEdit }, context) => {
      const token = authentication.getToken(context)
      const editedData = await customerEdit
      return customers.edit(customerId, editedData, token)
    },
    replacePhoto: async (root, { customerId, photoType, newPhoto }, context) => {
      const token = authentication.getToken(context)
      const photo = await newPhoto
      if (!photo) return customers.getCustomerById(customerId)
      return customers.updateEditedPhoto(customerId, photo, photoType)
        .then(newPatch => customers.edit(customerId, newPatch, token))
    },
    deleteEditedData: (root, { customerId, customerEdit }) => {
      // TODO: NOT IMPLEMENTING THIS FEATURE FOR THE CURRENT VERSION
      return customers.getCustomerById(customerId)
    },
    createCustomerNote: (...[, { customerId, title, content }, context]) => {
      const token = authentication.getToken(context)
      return customerNotes.createCustomerNote(customerId, token, title, content)
    },
    editCustomerNote: (...[, { noteId, newContent }, context]) => {
      const token = authentication.getToken(context)
      return customerNotes.updateCustomerNote(noteId, token, newContent)
    },
    deleteCustomerNote: (...[, { noteId }]) => {
      return customerNotes.deleteCustomerNote(noteId)
    },
    createCustomer: (...[, { phoneNumber }]) => customers.add({ phone: phoneNumber }),
    enableTestCustomer: (...[, { customerId }]) =>
      customers.enableTestCustomer(customerId),
    disableTestCustomer: (...[, { customerId }]) =>
      customers.disableTestCustomer(customerId)
  }
}

module.exports = resolvers
