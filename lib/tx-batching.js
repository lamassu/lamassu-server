const _ = require('lodash/fp')
const pgp = require('pg-promise')()
const uuid = require('uuid')

const db = require('./db')
const wallet = require('./wallet')

function createTransactionBatch (cryptoCode) {
  const sql = `INSERT INTO transaction_batches (id, crypto_code) VALUES ($1, $2) RETURNING *`

  return db.one(sql, [uuid.v4(), cryptoCode])
}

function closeTransactionBatch (batch) {
  const sql = `UPDATE transaction_batches SET status='ready', closed_at=now() WHERE id=$1`

  return db.none(sql, [batch.id])
}

function confirmSentBatch (batch) {
  const sql = `UPDATE transaction_batches SET status='sent', error_message=NULL WHERE id=$1`

  return db.none(sql, [batch.id])
}

function setErroredBatch (batch, errorMsg) {
  const sql = `UPDATE transaction_batches SET status='failed', error_message=$1 WHERE id=$2`

  return db.none(sql, [errorMsg, batch.id])
}

function addTransactionToBatch (tx) {
  const sql = `SELECT * FROM transaction_batches WHERE crypto_code=$1 AND status='open' ORDER BY created_at DESC LIMIT 1`
  const sql2 = `UPDATE cash_in_txs SET batch_id=$1 WHERE id=$2`

  return db.oneOrNone(sql, [tx.cryptoCode])
    .then(batch => {
      if (_.isNil(batch))
        return createTransactionBatch(tx.cryptoCode)
      return Promise.resolve(batch)
    })
    .then(batch => db.none(sql2, [batch.id, tx.id]))
}

function getBatchTransactions (batch) {
  const sql = `SELECT * FROM cash_in_txs WHERE batch_id=$1`
  return db.manyOrNone(sql, [batch.id])
}

function getBatchesByStatus (statuses) {
  const sql = `SELECT *, EXTRACT(EPOCH FROM (now() - created_at)) as time_elapsed FROM transaction_batches WHERE status in ($1^)`

  return db.manyOrNone(sql, [_.map(pgp.as.text, statuses).join(',')])
}

function submitBatch (settings, batch) {
  getBatchTransactions(batch)
    .then(txs => {
      wallet.sendCoinsBatch(settings, txs, batch.crypto_code)
        .then(() => confirmSentBatch(batch))
        .catch(err => setErroredBatch(batch, err.message))
    })
}

function processBatches (settings, lifecycle) {
  getBatchesByStatus(['open', 'failed'])
    .then(batches => {
      _.each(batch => {
        const elapsedMS = batch.time_elapsed * 1000

        if (elapsedMS >= lifecycle) {
          return closeTransactionBatch(batch)
            .then(() => submitBatch(settings, batch))
        }
      }, batches)
    })
}

module.exports = {
  createTransactionBatch,
  closeTransactionBatch,
  addTransactionToBatch,
  processBatches
}
