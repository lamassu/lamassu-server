const { Auth } = require('@vonage/auth')
const { SMS } = require('@vonage/sms')

const NAME = 'Vonage'

function sendMessage (account, rec) {
  const credentials = new Auth({
    apiKey: account.apiKey,
    apiSecret: account.apiSecret
  })

  const from = account.fromNumber
  const text = rec.sms.body
  const to = rec.sms.toNumber || account.toNumber

  const smsClient = new SMS(credentials)
  smsClient.send({ from, text, to })
    .catch(err => {
      throw new Error(`Vonage error: ${err.message}`)
    })
}

function getLookup () {
  throw new Error('Vonage error: lookup not supported')
}

module.exports = {
  NAME,
  sendMessage,
  getLookup
}
