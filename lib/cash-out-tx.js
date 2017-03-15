const _ = require('lodash/fp')
const pgp = require('pg-promise')()
const db = require('./db')
const BN = require('./bn')
const billMath = require('./bill-math')

module.exports = {post}

const mapValuesWithKey = _.mapValues.convert({cap: false})

const UPDATEABLE_FIELDS = ['txHash', 'status', 'dispensed', 'notified', 'redeem',
  'phone', 'error', 'confirmationTime']

function post (tx, pi) {
  const TransactionMode = pgp.txMode.TransactionMode
  const isolationLevel = pgp.txMode.isolationLevel
  const tmSRD = new TransactionMode({tiLevel: isolationLevel.serializable})

  function transaction (t) {
    const sql = 'select * from cash_out_txs where id=$1'

    console.log('DEBUG988: %j', tx)
    return t.oneOrNone(sql, [tx.id])
    .then(toObj)
    .then(oldTx => {
      return preProcess(oldTx, tx, pi)
      .then(preProcessedTx => upsert(oldTx, preProcessedTx))
    })
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

  newObj.direction = 'cashOut'

  return newObj
}

function upsert (oldTx, tx) {
  // insert bills

  if (!oldTx) {
    return insert(tx)
    .then(newTx => [oldTx, newTx])
  }

  return update(tx, diff(oldTx, tx))
  .then(newTx => [oldTx, newTx])
}

function mapDispense (tx) {
  const bills = tx.bills

  if (_.isEmpty(bills)) return tx

  const extra = {
    dispensed1: bills[0].actualDispense,
    dispensed2: bills[1].actualDispense,
    rejected1: bills[0].rejected,
    rejected2: bills[1].rejected,
    denomination1: bills[0].denomination,
    denomination2: bills[1].denomination,
    dispenseTime: 'NOW()^'
  }

  return _.assign(tx, extra)
}

function toDb (tx) {
  const mapper = (v, k) => {
    if (k === 'fiat' || k === 'cryptoAtoms') return v.toNumber()
    return v
  }

  const massager = _.flow(mapValuesWithKey(mapper), mapDispense, _.omit(['direction', 'bills']), _.mapKeys(_.snakeCase))
  return massager(tx)
}

function insert (tx) {
  const dbTx = toDb(tx)

  const sql = pgp.helpers.insert(dbTx, null, 'cash_out_txs') + ' returning *'
  console.log('DEBUG901: %s', sql)
  console.log('DEBUG902: %j', dbTx)
  return db.one(sql)
  .then(toObj)
}

function update (tx, changes) {
  if (_.isEmpty(changes)) return Promise.resolve(tx)

  const dbChanges = toDb(tx)
  console.log('DEBUG893: %j', dbChanges)
  const sql = pgp.helpers.update(dbChanges, null, 'cash_out_txs') +
    pgp.as.format(' where id=$1', [tx.id])

  const newTx = _.merge(tx, changes)

  return db.none(sql)
  .then(() => newTx)
}

function preProcess (tx, newTx, pi) {
  if (!tx) {
    console.log('DEBUG910')
    return pi.newAddress(newTx)
    .then(_.set('toAddress', _, newTx))
  }

  return Promise.resolve(newTx)
}

function postProcess (txVector, pi) {
  const [, newTx] = txVector

  if (newTx.dispensed && !newTx.bills) {
    return pi.buildCartridges()
    .then(cartridges => {
      return _.set('bills', billMath.makeChange(cartridges.cartridges, newTx.fiat), newTx)
    })
  }

  return Promise.resolve(newTx)
}
