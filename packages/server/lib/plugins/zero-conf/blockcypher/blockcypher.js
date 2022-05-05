const qs = require('querystring')
const axios = require('axios')
const _ = require('lodash/fp')

const { fetchRBF } = require('../../wallet/bitcoind/bitcoind')
module.exports = { authorize }

function highConfidence (confidence, txref, txRBF) {
  if (txref.double_spend) return 0
  if (txRBF) return 0
  if (txref.confirmations > 0 || txref.confidence * 100 >= confidence) return txref.value
  return 0
}

function authorize (account, toAddress, cryptoAtoms, cryptoCode, isBitcoindAvailable) {
  return Promise.resolve()
    .then(() => {
      if (cryptoCode !== 'BTC') throw new Error('Unsupported crypto: ' + cryptoCode)

      const query = qs.stringify({
        token: account.token,
        includeConfidence: true
      })

      const confidence = account.confidenceFactor
      const isRBFEnabled = account.rbf
      const url = `https://api.blockcypher.com/v1/btc/main/addrs/${toAddress}?${query}`

      return axios.get(url)
        .then(r => {
          const data = r.data
          if (isBitcoindAvailable && isRBFEnabled && data.unconfirmed_txrefs) {
            const promises = _.map(unconfirmedTxref => fetchRBF(unconfirmedTxref.tx_hash), data.unconfirmed_txrefs)
            return Promise.all(promises)
              .then(values => {
                const unconfirmedTxsRBF = _.fromPairs(values)
                const sumTxRefs = txrefs => _.sumBy(txref => highConfidence(confidence, txref, unconfirmedTxsRBF[txref.tx_hash]), txrefs)
                const authorizedValue = sumTxRefs(data.txrefs) + sumTxRefs(data.unconfirmed_txrefs)
                return cryptoAtoms.lte(authorizedValue)
              })
          }

          const sumTxRefs = txrefs => _.sumBy(txref => highConfidence(confidence, txref), txrefs)
          const authorizedValue = sumTxRefs(data.txrefs) + sumTxRefs(data.unconfirmed_txrefs)
          return cryptoAtoms.lte(authorizedValue)
        })
    })
}
