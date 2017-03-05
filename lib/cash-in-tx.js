const _ = require('lodash/fp')
const pgp = require('pg-promise')()
const db = require('./db')
const BN = require('./bn')

module.exports = {postCashIn}

const UPDATEABLE_FIELDS = ['fee', 'txHash', 'phone', 'error']

function postCashIn (tx, pi) {
  const TransactionMode = pgp.txMode.TransactionMode
  const isolationLevel = pgp.txMode.isolationLevel
  const tmSRD = new TransactionMode({tiLevel: isolationLevel.serializable})

  function transaction (t) {
    const sql = 'select * from cash_in_txs where id=$1'
    return t.oneOrNone(sql, [tx.id])
    .then(row => upsert(row, tx))
  }

  transaction.txMode = tmSRD

  return db.tx(transaction)
  .then(txVector => postProcess(txVector, pi))
  .then(changes => update(tx.id, changes))
}

function diff (oldTx, newTx) {
  let updatedTx = {}

  UPDATEABLE_FIELDS.forEach(fieldKey => {
    if (_.isEqual(oldTx[fieldKey], newTx[fieldKey])) return
    updatedTx[fieldKey] = newTx[fieldKey]
  })

  return updatedTx
}

function toObj (row) {
  const keys = _.keys(row)
  let newObj = {}

  keys.forEach(key => {
    const objKey = _.camelCase(key)
    if (key === 'crypto_atoms' || key === 'fiat') {
      newObj[objKey] = BN(row[key])
      return
    }

    newObj[objKey] = row[key]
  })

  return newObj
}

function upsert (row, tx) {
  const oldTx = toObj(row)

  if (oldTx) return insert(tx)
  return update(tx.id, diff(oldTx, tx))
}

function insert (tx) {
  const dbTx = _.mapKeys(_.snakeCase, tx)

  const sql = pgp.helpers.insert(dbTx, null, 'cash_in_txs')
  return db.none(sql)
}

function update (txId, changes) {
  const dbChanges = _.mapKeys(_.snakeCase, changes)
  const sql = pgp.helpers.update(dbChanges, null, 'cash_in_txs') +
    pgp.as.format(' where id=$1', [txId])

  return db.none(sql)
}

function postProcess (txVector, pi) {
  const [oldTx, newTx] = txVector

  if (newTx.sent && !oldTx.sent) {
    return pi.sendCoins(newTx)
    .then(txHash => ({txHash}))
    .catch(error => ({error}))
  }
}
