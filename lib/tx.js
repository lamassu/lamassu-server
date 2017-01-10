const db = require('./db')
const pgp = require('pg-promise')()

function postCashIn (tx) {
  const TransactionMode = pgp.txMode.TransactionMode
  const isolationLevel = pgp.txMode.isolationLevel
  const tmSRD = new TransactionMode({tiLevel: isolationLevel.serializable})

  function transaction (t) {
    const sql = 'select * from cash_in_txs where id=$1'
    return t.one(sql, [tx.id])
    .then(row => {
      const newTx = executeTxChange(tx, row)

      if (row) return updateCashOutTx(newTx)
      insertCashOutTx(newTx)
    })
  }

  transaction.txMode = tmSRD

  return db.tx(transaction)
  // retry failed
}

function postCashOut (tx) {

}

function post (tx) {
  if (tx.direction === 'cashIn') return postCashIn(tx)
  if (tx.direction === 'cashOut') return postCashOut(tx)
  throw new Error('No such tx direction: %s', tx.direction)
}

module.exports = {post}
