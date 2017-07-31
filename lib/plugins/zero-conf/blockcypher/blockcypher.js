const qs = require('querystring')
const axios = require('axios')
const _ = require('lodash/fp')

module.exports = {authorize}

function isHighConfidence (confidence, txref) {
  return txref.confirmations > 0 || txref.confidence * 100 >= confidence ? txref.value : 0
}

function authorize (account, toAddress, cryptoAtoms, cryptoCode) {
  return Promise.resolve()
  .then(() => {
    if (cryptoCode !== 'BTC') throw new Error('Unsupported crypto: ' + cryptoCode)

    const query = qs.stringify({
      token: account.token,
      includeConfidence: true
    })

    const confidence = account.confidence

    const url = `https://api.blockcypher.com/v1/btc/main/addrs/${toAddress}?${query}`

    console.log(url)
    return axios.get(url)
    .then(r => {
      const data = r.data
      const sumTxRefs = txrefs => _.sumBy(txref => isHighConfidence(confidence, txref), txrefs)

      const authorizedValue = sumTxRefs(data.txrefs) + sumTxRefs(data.unconfirmed_txrefs)

      return cryptoAtoms.lte(authorizedValue)
    })
  })
}

