const db = require('./db')
const pgp = require('pg-promise')()

function postCashIn (tx) {
  const TransactionMode = pgp.txMode.TransactionMode
  const isolationLevel = pgp.txMode.isolationLevel
  const tmSRD = new TransactionMode({tiLevel: isolationLevel.serializable})

  function transaction (t) {
    const sql = 'select * from cash_in_txs where id=$1'
    return t.oneOrNone(sql, [tx.id])
    .then(row => {
      const newTx = executeCashInTxChange(tx, row)

      if (row) return updateCashInTx(newTx)
      insertCashInTx(newTx)
    })
  }

  transaction.txMode = tmSRD

  return db.tx(transaction)
  // retry failed
}

function postCashOut (tx) {
  throw new Error('not implemented')
}

function post (tx) {
  if (tx.direction === 'cashIn') return postCashIn(tx)
  if (tx.direction === 'cashOut') return postCashOut(tx)

  return Promise.reject(new Error('No such tx direction: %s', tx.direction))
}

module.exports = {post}
