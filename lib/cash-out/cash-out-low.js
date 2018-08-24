const _ = require('lodash/fp')
const pgp = require('pg-promise')()

const helper = require('./cash-out-helper')

const toDb = helper.toDb
const toObj = helper.toObj

const UPDATEABLE_FIELDS = ['txHash', 'txVersion', 'status', 'dispense', 'dispenseConfirmed',
  'notified', 'redeem', 'phone', 'error', 'swept', 'publishedAt', 'confirmedAt', 'errorCode']

module.exports = {upsert, update, insert}

function upsert (t, oldTx, tx) {
  if (!oldTx) {
    return insert(t, tx)
      .then(newTx => [oldTx, newTx])
  }

  return update(t, tx, diff(oldTx, tx))
    .then(newTx => [oldTx, newTx])
}

function insert (t, tx) {
  const dbTx = toDb(tx)

  const sql = pgp.helpers.insert(dbTx, null, 'cash_out_txs') + ' returning *'
  return t.one(sql)
    .then(toObj)
}

function update (t, tx, changes) {
  if (_.isEmpty(changes)) return Promise.resolve(tx)

  const dbChanges = toDb(changes)
  const sql = pgp.helpers.update(dbChanges, null, 'cash_out_txs') +
    pgp.as.format(' where id=$1', [tx.id])

  const newTx = _.merge(tx, changes)

  return t.none(sql)
    .then(() => newTx)
}

function diff (oldTx, newTx) {
  let updatedTx = {}

  UPDATEABLE_FIELDS.forEach(fieldKey => {
    if (oldTx && _.isEqualWith(nilEqual, oldTx[fieldKey], newTx[fieldKey])) return

    // We never null out an existing field
    if (oldTx && _.isNil(newTx[fieldKey])) return

    updatedTx[fieldKey] = newTx[fieldKey]
  })

  return updatedTx
}

function nilEqual (a, b) {
  if (_.isNil(a) && _.isNil(b)) return true

  return undefined
}
