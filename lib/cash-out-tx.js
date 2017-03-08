const _ = require('lodash/fp')
const pgp = require('pg-promise')()
const db = require('./db')
const BN = require('./bn')

module.exports = {post}

//  id                | uuid                     | not null
//  device_id         | text                     | not null
//  to_address        | text                     | not null
//  crypto_atoms      | bigint                   | not null
//  crypto_code       | text                     | not null
//  fiat              | numeric(14,5)            | not null
//  currency_code     | text                     | not null
//  tx_hash           | text                     |
//  status            | status_stage             | not null default 'notSeen'::status_stage
//  dispensed         | boolean                  | not null default false
//  notified          | boolean                  | not null default false
//  redeem            | boolean                  | not null default false
//  phone             | text                     |
//  error             | text                     |
//  created           | timestamp with time zone | not null default now()
//  confirmation_time | timestamp with time zone |

const UPDATEABLE_FIELDS = ['txHash', 'status', 'dispensed', 'notified', 'redeem',
  'phone', 'error', 'confirmationTime']

function post (tx, pi) {
  const TransactionMode = pgp.txMode.TransactionMode
  const isolationLevel = pgp.txMode.isolationLevel
  const tmSRD = new TransactionMode({tiLevel: isolationLevel.serializable})

  function transaction (t) {
    const sql = 'select * from cash_out_txs where id=$1'

    console.log('DEBUG888: %j', tx)
    return t.oneOrNone(sql, [tx.id])
    .then(row => upsert(row, tx))
  }

  transaction.txMode = tmSRD

  return db.tx(transaction)
  .then(txVector => {
    const [, newTx] = txVector
    return postProcess(txVector, pi)
    .then(changes => update(newTx, changes))
  })
}

function nilEqual (a, b) {
  if (_.isNil(a) && _.isNil(b)) return true

  return undefined
}

function diff (oldTx, newTx) {
  let updatedTx = {}

  UPDATEABLE_FIELDS.forEach(fieldKey => {
    console.log('DEBUG80: %j', [oldTx[fieldKey], newTx[fieldKey]])
    if (oldTx && _.isEqualWith(nilEqual, oldTx[fieldKey], newTx[fieldKey])) return

    // We never null out an existing field
    if (oldTx && _.isNil(newTx[fieldKey])) return

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

  const sql = pgp.helpers.insert(dbTx, null, 'cash_out_txs') + ' returning *'
  return db.one(sql)
  .then(toObj)
}

function update (tx, changes) {
  if (_.isEmpty(changes)) return Promise.resolve(tx)

  const dbChanges = _.mapKeys(_.snakeCase, _.omit(['direction', 'bills'], changes))
  console.log('DEBUG893: %j', dbChanges)
  const sql = pgp.helpers.update(dbChanges, null, 'cash_out_txs') +
    pgp.as.format(' where id=$1', [tx.id]) + ' returning *'

  return db.one(sql)
  .then(toObj)
}

function postProcess (txVector, pi) {
  const [oldTx, newTx] = txVector

  return Promise.resolve({})
}
