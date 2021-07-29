const customSms = require('../../../custom-sms')

const resolvers = {
  Query: {
    customMessages: () => customSms.getCustomMessages()
  },
  Mutation: {
    createCustomMessage: (...[, { event, deviceId, message }]) => customSms.createCustomMessage(event, deviceId, message)
  }
}

module.exports = resolvers
