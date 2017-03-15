const _ = require('lodash/fp')
const BN = require('./bn')
const CashInTx = require('./cash-in-tx')
const CashOutTx = require('./cash-out-tx')

function post (tx, pi) {
  const mtx = massage(tx)
  if (mtx.direction === 'cashIn') return CashInTx.post(mtx, pi)
  if (mtx.direction === 'cashOut') return CashOutTx.post(mtx, pi)

  return Promise.reject(new Error('No such tx direction: ' + mtx.direction))
}

function massage (tx) {
  return _.assign(tx, {cryptoAtoms: BN(tx.cryptoAtoms), fiat: BN(tx.fiat)})
}

module.exports = {post}
