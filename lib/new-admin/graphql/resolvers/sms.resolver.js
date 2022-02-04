const customSms = require('../../../sms-notices')

const resolvers = {
  Query: {
    SMSNotices: () => customSms.getSMSNotices()
  },
  Mutation: {
    editSMSNotice: (...[, { id, event, message }]) => customSms.editSMSNotice(id, event, message),
    enableSMSNotice: (...[, { id }]) => customSms.enableSMSNotice(id),
    disableSMSNotice: (...[, { id }]) => customSms.disableSMSNotice(id)
  }
}

module.exports = resolvers
