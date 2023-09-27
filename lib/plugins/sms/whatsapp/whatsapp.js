const axios = require('axios')

const NAME = 'Whatsapp'

function sendMessage (account, rec) {
  const phoneId = account.phoneId
  const token = account.apiKey
  
  const to = rec.sms.toNumber || account.toNumber
  const template = rec.sms.template

  const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`

  const config = {
    headers:{
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  const data = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    type: 'template',
    to,
    template: {
      name: template,
      language: { code: 'en_US' }
    }
  }

  axios.post(url, data, config)
    .catch(err => {
    //   console.log(err)
      throw new Error(`Whatsapp error: ${err.message}`)
    })
}

function getLookup () {
  throw new Error('Whatsapp error: lookup not supported')
}

module.exports = {
  NAME,
  sendMessage,
  getLookup
}
