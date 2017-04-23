const _ = require('lodash/fp')
const pgp = require('pg-promise')()
const db = require('./db')
const BN = require('./bn')
const plugins = require('./plugins')
const logger = require('./logger')

const mapValuesWithKey = _.mapValues.convert({cap: false})

module.exports = {post, monitorPending}

const UPDATEABLE_FIELDS = ['fee', 'txHash', 'phone', 'error', 'send',
  'cryptoAtoms', 'fiat', 'timedout']
const PENDING_INTERVAL = '1 day'
const MAX_PENDING = 10

function post (tx, pi) {
  const TransactionMode = pgp.txMode.TransactionMode
  const isolationLevel = pgp.txMode.isolationLevel
  const tmSRD = new TransactionMode({tiLevel: isolationLevel.serializable})

  console.log('DEBUG502: %j', tx)
  function transaction (t) {
    const sql = 'select * from cash_in_txs where id=$1'
    const sql2 = 'select * from bills where cash_in_txs_id=$1'

    return t.oneOrNone(sql, [tx.id])
    .then(row => {
      return t.any(sql2, [tx.id])
      .then(billRows => {
        const oldTx = toObj(row)

        return preProcess(oldTx, tx, pi)
        .then(preProcessedTx => upsert(oldTx, preProcessedTx))
        .then(vector => {
          return insertNewBills(billRows, tx)
          .then(newBills => _.concat(vector, [newBills]))
        })
      })
    })
  }

  transaction.txMode = tmSRD

  return db.tx(transaction)
  .then(txVector => {
    const [oldTx, newTx, newBills] = txVector
    const oldBills = oldTx ? oldTx.bills : []
    return postProcess(txVector, pi)
    .then(changes => update(newTx, changes))
    .then(tx => _.merge({bills: _.concat(oldBills, newBills)}, tx))
  })
}

function nilEqual (a, b) {
  if (_.isNil(a) && _.isNil(b)) return true

  return undefined
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

  newObj.direction = 'cashIn'

  return newObj
}

function convertBigNumFields (obj) {
  const convert = (value, key) => _.includes(key, ['cryptoAtoms', 'fiat'])
  ? value.toString()
  : value

  const convertKey = key => _.includes(key, ['cryptoAtoms', 'fiat'])
  ? key + '#'
  : key

  return _.mapKeys(convertKey, mapValuesWithKey(convert, obj))
}

function pullNewBills (billRows, tx) {
  if (_.isEmpty(tx.bills)) return []

  const toBill = _.mapKeys(_.camelCase)
  const bills = _.map(toBill, billRows)

  return _.differenceBy(_.get('id'), tx.bills, bills)
}

const massage = _.flow(_.omit(['direction', 'bills']), convertBigNumFields, _.mapKeys(_.snakeCase))

function insertNewBills (billRows, tx) {
  const bills = pullNewBills(billRows, tx)
  if (_.isEmpty(bills)) return Promise.resolve([])

  const dbBills = _.map(massage, bills)
  const columns = _.keys(dbBills[0])
  const sql = pgp.helpers.insert(dbBills, columns, 'bills')

  return db.none(sql)
  .then(() => bills)
}

function upsert (oldTx, tx) {
  if (!oldTx) {
    console.log('DEBUG500: %j', tx)
    return insert(tx)
    .then(newTx => [oldTx, newTx])
  }

  return update(tx, diff(oldTx, tx))
  .then(newTx => [oldTx, newTx])
}

function insert (tx) {
  const dbTx = massage(tx)

  const sql = pgp.helpers.insert(dbTx, null, 'cash_in_txs') + ' returning *'
  return db.one(sql)
  .then(toObj)
}

function update (tx, changes) {
  if (_.isEmpty(changes)) return Promise.resolve(tx)

  const dbChanges = massage(changes)
  const sql = pgp.helpers.update(dbChanges, null, 'cash_in_txs') +
    pgp.as.format(' where id=$1', [tx.id]) + ' returning *'

  return db.one(sql)
  .then(toObj)
}

function registerTrades (pi, txVector) {
  console.log('DEBUG400')
  const newBills = _.last(txVector)
  console.log('DEBUG401: %j', newBills)
  _.forEach(bill => pi.buy(bill), newBills)
}

function logAction (rec, tx) {
  const action = {
    tx_id: tx.id,
    action: tx.sendCompleted ? 'sendCoins' : 'sendCoinsError',
    error: rec.error,
    error_code: rec.errorCode,
    tx_hash: rec.txHash
  }

  const sql = pgp.helpers.insert(action, null, 'cash_in_actions')

  return db.none(sql)
  .then(_.constant(rec))
}

function postProcess (txVector, pi) {
  const [oldTx, newTx] = txVector

  registerTrades(pi, txVector)

  const isClearToSend = newTx.send &&
  !oldTx.sendPending &&
  !oldTx.sendConfirmed

  if (isClearToSend) {
    return pi.sendCoins(newTx)
    .then(txHash => ({
      txHash,
      sendConfirmed: true,
      sendTime: 'now()^',
      sendPending: false,
      error: null,
      errorCode: null
    }))
    .catch(err => ({
      sendTime: 'now()^',
      error: err.message,
      errorCode: err.name,
      sendPending: false
    }))
    .then(r => logAction(r, newTx))
  }

  return Promise.resolve({})
}

function preProcess (oldTx, newTx, pi) {
  return new Promise(resolve => {
    if (!oldTx) return resolve(newTx)
    if (newTx.send && !oldTx.send) return resolve(_.set('sendPending', true, newTx))
    return resolve(newTx)
  })
}

function monitorPending (settings) {
  const sql = `select * from cash_in_txs
  where created > now() - interval $1
  and send
  and not send_confirmed
  and not send_pending
  and not operator_completed
  order by created
  limit $2`

  const processPending = row => {
    const tx = toObj(row)
    const pi = plugins(settings, tx.deviceId)

    return post(tx, pi)
    .catch(logger.error)
  }

  return db.any(sql, [PENDING_INTERVAL, MAX_PENDING])
  .then(_.tap(console.log))
  .then(rows => Promise.all(_.map(processPending, rows)))
  .catch(logger.error)
}
