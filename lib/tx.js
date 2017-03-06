const CashInTx = require('./cash-in-tx')

function post (tx, pi) {
  if (tx.direction === 'cashIn') return CashInTx.post(tx, pi)
  if (tx.direction === 'cashOut') throw new Error('not implemented')

  return Promise.reject(new Error('No such tx direction: %s', tx.direction))
}

module.exports = {post}
