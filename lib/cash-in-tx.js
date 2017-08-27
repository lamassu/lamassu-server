const _ = require('lodash/fp')
const pgp = require('pg-promise')()
const db = require('./db')
const BN = require('./bn')
const plugins = require('./plugins')
const logger = require('./logger')
const T = require('./time')
const E = require('./error')

const PENDING_INTERVAL = '60 minutes'
const PENDING_INTERVAL_MS = 60 * T.minutes
const MAX_PENDING = 10

module.exports = {post, monitorPending, cancel, PENDING_INTERVAL}

function atomic (machineTx, pi) {
  const TransactionMode = pgp.txMode.TransactionMode
  const isolationLevel = pgp.txMode.isolationLevel
  const tmSRD = new TransactionMode({tiLevel: isolationLevel.serializable})

  function transaction (t) {
    const sql = 'select * from cash_in_txs where id=$1'
    const sql2 = 'select * from bills where cash_in_txs_id=$1'

    return t.oneOrNone(sql, [machineTx.id])
    .then(row => {
      if (row && row.tx_version >= machineTx.txVersion) throw new E.StaleTxError('Stale tx')

      return t.any(sql2, [machineTx.id])
      .then(billRows => {
        const dbTx = toObj(row)

        return preProcess(dbTx, machineTx, pi)
        .then(preProcessedTx => upsert(dbTx, preProcessedTx))
        .then(r => {
          return insertNewBills(billRows, machineTx)
          .then(newBills => _.set('newBills', newBills, r))
        })
      })
    })
  }

  transaction.txMode = tmSRD

  return transaction
}

function post (machineTx, pi) {
  return db.tx(atomic(machineTx, pi))
  .then(r => {
    const updatedTx = r.tx

    return postProcess(r, pi)
    .then(changes => update(updatedTx, changes))
    .then(tx => _.set('bills', machineTx.bills, tx))
  })
}

function nilEqual (a, b) {
  if (_.isNil(a) && _.isNil(b)) return true

  return undefined
}

function isMonotonic (oldField, newField, fieldKey) {
  if (_.isNil(newField)) return false
  if (_.isBoolean(oldField)) return oldField === newField || !oldField
  if (oldField.isBigNumber) return oldField.lte(newField)
  if (_.isNumber(oldField)) return oldField <= newField

  throw new Error(`Unexpected value [${fieldKey}]: ${oldField}, ${newField}`)
}

function ensureRatchet (oldField, newField, fieldKey) {
  const monotonic = ['cryptoAtoms', 'fiat', 'cashInFeeCrypto', 'send', 'sendConfirmed', 'operatorCompleted', 'timedout', 'txVersion']
  const free = ['sendPending', 'error', 'errorCode']

  if (_.isNil(oldField)) return true
  if (_.includes(fieldKey, monotonic)) return isMonotonic(oldField, newField, fieldKey)

  if (_.includes(fieldKey, free)) {
    if (_.isNil(newField)) return false
    return true
  }

  if (oldField.isBigNumber && newField.isBigNumber) return BN(oldField).eq(newField)
  if (oldField.toString() === newField.toString()) return true

  return false
}

function diff (oldTx, newTx) {
  let updatedTx = {}

  if (!oldTx) throw new Error('oldTx must not be null')
  if (!newTx) throw new Error('newTx must not be null')

  _.forEach(fieldKey => {
    const oldField = oldTx[fieldKey]
    const newField = newTx[fieldKey]
    if (fieldKey === 'bills') return
    if (_.isEqualWith(nilEqual, oldField, newField)) return

    if (!ensureRatchet(oldField, newField, fieldKey)) {
      logger.warn('Value from lamassu-machine would violate ratchet [%s]', fieldKey)
      logger.warn('Old tx: %j', oldTx)
      logger.warn('New tx: %j', newTx)
      throw new Error('Value from lamassu-machine would violate ratchet')
    }

    updatedTx[fieldKey] = newField
  }, _.keys(newTx))

  return updatedTx
}

function toObj (row) {
  if (!row) return null

  const keys = _.keys(row)
  let newObj = {}

  keys.forEach(key => {
    const objKey = _.camelCase(key)
    if (_.includes(key, ['crypto_atoms', 'fiat', 'cash_in_fee', 'cash_in_fee_crypto'])) {
      newObj[objKey] = BN(row[key])
      return
    }

    newObj[objKey] = row[key]
  })

  newObj.direction = 'cashIn'

  return newObj
}

function convertBigNumFields (obj) {
  const convert = value => value && value.isBigNumber
  ? value.toString()
  : value

  return _.mapValues(convert, obj)
}

function pullNewBills (billRows, machineTx) {
  if (_.isEmpty(machineTx.bills)) return []

  const toBill = _.mapKeys(_.camelCase)
  const bills = _.map(toBill, billRows)

  return _.differenceBy(_.get('id'), machineTx.bills, bills)
}

const massage = _.flow(_.omit(['direction', 'cryptoNetwork', 'bills']), convertBigNumFields, _.mapKeys(_.snakeCase))

function insertNewBills (billRows, machineTx) {
  const bills = pullNewBills(billRows, machineTx)
  if (_.isEmpty(bills)) return Promise.resolve([])

  const dbBills = _.map(massage, bills)
  const columns = _.keys(dbBills[0])
  const sql = pgp.helpers.insert(dbBills, columns, 'bills')

  return db.none(sql)
  .then(() => bills)
}

function upsert (dbTx, preProcessedTx) {
  if (!dbTx) {
    return insert(preProcessedTx)
    .then(tx => ({dbTx, tx}))
  }

  return update(dbTx, diff(dbTx, preProcessedTx))
  .then(tx => ({dbTx, tx}))
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

function registerTrades (pi, newBills) {
  _.forEach(bill => pi.buy(bill), newBills)
}

function logAction (rec, tx) {
  const action = {
    tx_id: tx.id,
    action: rec.action || (rec.sendConfirmed ? 'sendCoins' : 'sendCoinsError'),
    error: rec.error,
    error_code: rec.errorCode,
    tx_hash: rec.txHash
  }

  const sql = pgp.helpers.insert(action, null, 'cash_in_actions')

  return db.none(sql)
  .then(_.constant(rec))
}

function logActionById (action, _rec, txId) {
  const rec = _.assign(_rec, {action, tx_id: txId})
  const sql = pgp.helpers.insert(rec, null, 'cash_in_actions')

  return db.none(sql)
}

function isClearToSend (oldTx, newTx) {
  const now = Date.now()

  return newTx.send &&
    (!oldTx || (!oldTx.sendPending && !oldTx.sendConfirmed)) &&
    (newTx.created > now - PENDING_INTERVAL_MS)
}

function postProcess (r, pi) {
  registerTrades(pi, r.newBills)

  if (isClearToSend(r.dbTx, r.tx)) {
    return pi.sendCoins(r.tx)
    .then(txHash => ({
      txHash,
      sendConfirmed: true,
      sendTime: 'now()^',
      sendPending: false,
      error: null,
      errorCode: null
    }))
    .catch(err => {
      // Important: We don't know what kind of error this is
      // so not safe to assume that funds weren't sent.
      // Therefore, don't set sendPending to false except for
      // errors (like InsufficientFundsError) that are guaranteed
      // not to send.
      const sendPending = err.name !== 'InsufficientFundsError'

      return {
        sendTime: 'now()^',
        error: err.message,
        errorCode: err.name,
        sendPending
      }
    })
    .then(sendRec => logAction(sendRec, r.tx))
  }

  return Promise.resolve({})
}

function preProcess (dbTx, machineTx, pi) {
  // Note: The way this works is if we're clear to send,
  // we mark the transaction as sendPending.
  //
  // If another process is trying to also mark this as sendPending
  // that means that it saw the tx as sendPending=false.
  // But if that's true, then it must be serialized before this
  // (otherwise it would see sendPending=true), and therefore we can't
  // be seeing sendPending=false (a pre-condition of clearToSend()).
  // Therefore, one of the conflicting transactions will error,
  // which is what we want.
  return new Promise(resolve => {
    if (!dbTx) return resolve(machineTx)

    if (isClearToSend(dbTx, machineTx)) {
      return resolve(_.set('sendPending', true, machineTx))
    }

    return resolve(machineTx)
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
  .then(rows => Promise.all(_.map(processPending, rows)))
  .catch(logger.error)
}

function cancel (txId) {
  const updateRec = {
    error: 'Operator cancel',
    error_code: 'operatorCancel',
    operator_completed: true
  }

  return Promise.resolve()
  .then(() => {
    return pgp.helpers.update(updateRec, null, 'cash_in_txs') +
      pgp.as.format(' where id=$1', [txId])
  })
  .then(sql => db.result(sql, false))
  .then(res => {
    if (res.rowCount !== 1) throw new Error('No such tx-id')
  })
  .then(() => logActionById('operatorCompleted', {}, txId))
}
