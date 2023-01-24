const https = require('https')
const axios = require('axios').create({
  // TODO: get rejectUnauthorized true to work
  baseURL: `${process.env.PAZUZ_SERVICES_API_URL}`,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
})

const BN = require('../../../bn')

function ticker (account, fiatCode, cryptoCode) {
  return axios.get(`/api/ticker/rates/${cryptoCode}/${fiatCode}`)
    .then(({ data }) => {
      if (data.error) throw new Error(JSON.stringify(data.error))
      return {
        rates: {
          ask: BN(data.ask),
          bid: BN(data.bid),
          signature: data.signature
        }
      }
    })
}

module.exports = {
  ticker
}
