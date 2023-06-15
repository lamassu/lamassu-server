const _ = require('lodash/fp')

const txBatching = require('./tx-batching')
const wallet = require('./wallet')

function submitBatch (settings, batch) {
  txBatching.getBatchTransactions(batch)
    .then(txs => {
      if (_.isEmpty(txs)) return Promise.resolve()
      return wallet.sendCoinsBatch(settings, txs, batch.crypto_code)
        .then(res => txBatching.confirmSentBatch(batch, res))
        .catch(err => txBatching.setErroredBatch(batch, err.message))
    })
}

function processBatches (settings, lifecycle) {
  return txBatching.getBatchesByStatus(['open'])
    .then(batches => {
      _.each(batch => {
        const elapsedMS = batch.time_elapsed * 1000

        if (elapsedMS >= lifecycle) {
          return txBatching.closeTransactionBatch(batch)
            .then(() => submitBatch(settings, batch))
        }
      }, batches)
    })
}

module.exports = processBatches
