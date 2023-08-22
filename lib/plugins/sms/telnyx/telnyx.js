const Telnyx = require('telnyx')

const NAME = 'Telnyx'

function sendMessage (account, rec) {
  const telnyx = Telnyx(account.apiKey)

  const from = account.fromNumber
  const text = rec.sms.body
  const to = rec.sms.toNumber || account.toNumber

  return telnyx.messages.create({ from, to, text })
    .catch(err => {
      throw new Error(`Telnyx error: ${err.message}`)
    })
}

function getLookup () {
  throw new Error('Telnyx error: lookup not supported')
}


module.exports = {
  NAME,
  sendMessage,
  getLookup
}
