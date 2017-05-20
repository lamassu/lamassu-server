const qs = require('querystring')
const axios = require('axios')
const _ = require('lodash/fp')

module.exports = {authorize}

function authorize (account, toAddress, cryptoAtoms, cryptoCode) {
  return Promise.resolve()
  .then(() => {
    if (cryptoCode !== 'BTC') throw new Error('Unsupported crypto: ' + cryptoCode)

    const query = qs.stringify({
      token: account.token,
      includeConfidence: true,
      confidence: account.confidence
    })

    const url = `https://api.blockcypher.com/v1/btc/main/addrs/${toAddress}?${query}`

    return axios.get(url)
    .then(r => {
      const data = r.data
      const authorizedValue = _.sumBy('value', data.txrefs)

      return cryptoAtoms.lte(authorizedValue)
    })
  })
}
