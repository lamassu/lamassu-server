const qs = require('querystring')
const axios = require('axios')
const _ = require('lodash/fp')

const { fetchRBF } = require('../../wallet/bitcoind/bitcoind')
module.exports = { authorize }

function highConfidence (confidence, txref) {
  if (txref.double_spend) return 0
  if (txref.rbf) return 0
  if (txref.confirmations > 0 || txref.confidence * 100 >= confidence) return txref.value
  return 0
}

function authorize (account, toAddress, cryptoAtoms, cryptoCode, isBitcoindAvailable) {
  let promise = []
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
          const sumTxRefs = txrefs => _.sumBy(txref => highConfidence(confidence, txref), txrefs)
          if (isBitcoindAvailable && isRBFEnabled && data.unconfirmed_txrefs) {
            _.map(unconfirmedTxref => {
              promise.push(new Promise((resolve, reject) => { resolve(fetchRBF(unconfirmedTxref.tx_hash)) }))
            }, data.unconfirmed_txrefs)
            return Promise.all(promise)
              .then(values => {
                _.map(rbfInfo => {
                  _.map(unconfirmedTxref => {
                    if (rbfInfo.tx_hash === unconfirmedTxref.tx_hash) unconfirmedTxref.rbf = rbfInfo['bip125-replaceable']
                  }, data.unconfirmed_txrefs)
                }, values)
                const authorizedValue = sumTxRefs(data.txrefs) + sumTxRefs(data.unconfirmed_txrefs)
                return cryptoAtoms.lte(authorizedValue)
              })
          } else {
            const authorizedValue = sumTxRefs(data.txrefs) + sumTxRefs(data.unconfirmed_txrefs)
            return cryptoAtoms.lte(authorizedValue)
          }
        })
    })
}
