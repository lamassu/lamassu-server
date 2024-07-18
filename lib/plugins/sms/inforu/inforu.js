const axios = require('axios')

const NAME = 'InforU'

function sendMessage (account, rec) {
  const username = account.username
  const apiKey = account.apiKey
  
  const to = rec.sms.toNumber || account.toNumber
  const text = rec.sms.body
  const from = account.fromNumber

  const url = 'https://capi.inforu.co.il/api/v2/SMS/SendSms'

  const config = {
    auth: {
      username: username,
      password: apiKey
    },
    maxBodyLength: Infinity,
    headers:{
      'Content-Type': 'application/json'
    }
  }

  const data = {
    Message: text,
    Recipients: [{ 
      Phone: to 
    }],
    Settings: {
        Sender: from
    }
  }

  axios.post(url, data, config)
    .catch(err => {
    //   console.log(err)
      throw new Error(`inforu error: ${err.message}`)
    })
}

function getLookup () {
  throw new Error('inforu error: lookup not supported')
}

module.exports = {
  NAME,
  sendMessage,
  getLookup
}
