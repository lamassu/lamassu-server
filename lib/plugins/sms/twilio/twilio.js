const Client = require('twilio')
const _ = require('lodash/fp')

const NAME = 'Twilio'

const BAD_NUMBER_CODES = [21201, 21202, 21211, 21214, 21216, 21217, 21219, 21408,
  21610, 21612, 21614, 21608]

function sendMessage (account, rec) {
  const client = Client(account.accountSid, account.authToken)
  const body = rec.sms.body
  const _toNumber = rec.sms.toNumber || account.toNumber

  return client.sendMessage({
    body: body,
    to: _toNumber,
    from: account.fromNumber
  })
  .catch(err => {
    if (_.includes(err.code, BAD_NUMBER_CODES)) {
      const badNumberError = new Error(err.message)
      badNumberError.name = 'BadNumberError'
      throw badNumberError
    }

    throw new Error(err.message)
  })
}

module.exports = {
  NAME,
  sendMessage
}
