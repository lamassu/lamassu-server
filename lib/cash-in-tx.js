const _ = require('lodash/fp')
const pgp = require('pg-promise')()
const db = require('./db')
const BN = require('./bn')

module.exports = {post}

const UPDATEABLE_FIELDS = ['fee', 'txHash', 'phone', 'error', 'send']

function post (tx, pi) {
  const TransactionMode = pgp.txMode.TransactionMode
  const isolationLevel = pgp.txMode.isolationLevel
  const tmSRD = new TransactionMode({tiLevel: isolationLevel.serializable})

  function transaction (t) {
    const sql = 'select * from cash_in_txs where id=$1'

    console.log('DEBUG888: %j', tx)
    return t.oneOrNone(sql, [tx.id])
    .then(row => upsert(row, tx))
  }

  transaction.txMode = tmSRD

  return db.tx(transaction)
  .then(txVector => {
    const [, newTx] = txVector
    postProcess(txVector, pi)
    .then(changes => update(newTx, changes))
  })
}

function diff (oldTx, newTx) {
  let updatedTx = {}

  UPDATEABLE_FIELDS.forEach(fieldKey => {
    if (oldTx && _.isEqual(oldTx[fieldKey], newTx[fieldKey])) return
    updatedTx[fieldKey] = newTx[fieldKey]
  })

  return updatedTx
}

function toObj (row) {
  if (!row) return null

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

  // insert bills

  if (!oldTx) {
    return insert(tx)
    .then(newTx => [oldTx, newTx])
  }

  return update(tx, diff(oldTx, tx))
  .then(newTx => [oldTx, newTx])
}

function insert (tx) {
  const dbTx = _.mapKeys(_.snakeCase, _.omit(['direction', 'bills'], tx))

  const sql = pgp.helpers.insert(dbTx, null, 'cash_in_txs') + ' returning *'
  return db.one(sql)
  .then(toObj)
}

function update (tx, changes) {
  if (_.isEmpty(changes)) return Promise.resolve(tx)

  const dbChanges = _.mapKeys(_.snakeCase, _.omit(['direction', 'bills'], changes))
  console.log('DEBUG893: %j', dbChanges)
  const sql = pgp.helpers.update(dbChanges, null, 'cash_in_txs') +
    pgp.as.format(' where id=$1', [tx.id]) + ' returning *'

  return db.one(sql)
  .then(toObj)
}

function postProcess (txVector, pi) {
  const [oldTx, newTx] = txVector

  if (newTx.send && !oldTx.send) {
    return pi.sendCoins(newTx)
    .then(txHash => ({txHash}))
    .catch(error => {
      console.log('DEBUG895: %j', error)
      return {error}
    })
  }

  return Promise.resolve({})
}
