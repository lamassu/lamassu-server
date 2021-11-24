const customSms = require('../../../custom-sms')

const resolvers = {
  Query: {
    customMessages: () => customSms.getCustomMessages()
  },
  Mutation: {
    createCustomMessage: (...[, { event, message }]) => customSms.createCustomMessage(event, message),
    editCustomMessage: (...[, { id, event, message }]) => customSms.editCustomMessage(id, event, message),
    deleteCustomMessage: (...[, { id }]) => customSms.deleteCustomMessage(id)
  }
}

module.exports = resolvers
