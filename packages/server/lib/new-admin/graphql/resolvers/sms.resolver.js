const smsNotices = require('../../../sms-notices')

const resolvers = {
  Query: {
    SMSNotices: () => smsNotices.getSMSNotices()
  },
  Mutation: {
    editSMSNotice: (...[, { id, event, message }]) => smsNotices.editSMSNotice(id, event, message),
    enableSMSNotice: (...[, { id }]) => smsNotices.enableSMSNotice(id),
    disableSMSNotice: (...[, { id }]) => smsNotices.disableSMSNotice(id)
  }
}

module.exports = resolvers
