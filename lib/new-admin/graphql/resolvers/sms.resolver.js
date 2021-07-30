const customSms = require('../../../custom-sms')

const resolvers = {
  Query: {
    customMessages: () => customSms.getCustomMessages()
  },
  Mutation: {
    createCustomMessage: (...[, { event, deviceId, message }]) => customSms.createCustomMessage(event, deviceId, message),
    editCustomMessage: (...[, { id, event, deviceId, message }]) => customSms.editCustomMessage(id, event, deviceId, message),
    deleteCustomMessage: (...[, { id }]) => customSms.deleteCustomMessage(id)
  }
}

module.exports = resolvers
