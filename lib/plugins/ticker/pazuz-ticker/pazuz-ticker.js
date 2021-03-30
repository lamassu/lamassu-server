const https = require('https')
const axios = require('axios').create({
  // TODO: get rejectUnauthorized true to work
  baseURL: 'https://localhost:5557/api/rates/',
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
})
const BN = require('../../../bn')

function ticker (account, fiatCode, cryptoCode) {
  return axios.get(`${cryptoCode}/${fiatCode}`)
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
