const qs = require('querystring')
const axios = require('axios')
const _ = require('lodash/fp')

module.exports = {authorize}

function highConfidence (confidence, txref) {
  if (txref.double_spend) return 0
  if (txref.confirmations > 0 || txref.confidence * 100 >= confidence) return txref.value
  return 0
}

function authorize (account, toAddress, cryptoAtoms, cryptoCode) {
  return Promise.resolve()
    .then(() => {
      if (cryptoCode !== 'BTC') throw new Error('Unsupported crypto: ' + cryptoCode)

      const query = qs.stringify({
        token: account.token,
        includeConfidence: true
      })

      const confidence = account.confidenceFactor

      const url = `https://api.blockcypher.com/v1/btc/main/addrs/${toAddress}?${query}`

      return axios.get(url)
        .then(r => {
          const data = r.data
          const sumTxRefs = txrefs => _.sumBy(txref => highConfidence(confidence, txref), txrefs)

          const authorizedValue = sumTxRefs(data.txrefs) + sumTxRefs(data.unconfirmed_txrefs)

          return cryptoAtoms.lte(authorizedValue)
        })
    })
}
