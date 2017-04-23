const _ = require('lodash/fp')
const pgp = require('pg-promise')()

const db = require('./db')
const BN = require('./bn')
const billMath = require('./bill-math')
const T = require('./time')
const logger = require('./logger')
const plugins = require('./plugins')

module.exports = {
  post,
  monitorLiveIncoming,
  monitorStaleIncoming,
  monitorUnnotified,
  cancel
}

const mapValuesWithKey = _.mapValues.convert({cap: false})

const UPDATEABLE_FIELDS = ['txHash', 'status', 'dispensed', 'notified', 'redeem',
  'phone', 'error', 'confirmationTime', 'swept']

const STALE_INCOMING_TX_AGE = T.week
const STALE_LIVE_INCOMING_TX_AGE = 10 * T.minutes
const MAX_NOTIFY_AGE = 2 * T.days
const MIN_NOTIFY_AGE = 5 * T.minutes

function post (tx, pi) {
  const TransactionMode = pgp.txMode.TransactionMode
  const isolationLevel = pgp.txMode.isolationLevel
  const tmSRD = new TransactionMode({tiLevel: isolationLevel.serializable})

  function transaction (t) {
    const sql = 'select * from cash_out_txs where id=$1'

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
    .then(savedTx => {
      return logAction(tx, savedTx)
      .then(_.constant(savedTx))
    })
  })
}

function logError (action, err) {
  return logAction({
    action,
    error: err.message,
    error_code: err.name
  })
}

function mapDispense (tx) {
  const bills = tx.bills

  if (_.isEmpty(bills)) return {}

  const dispense = {
    provisioned_1: bills[0].provisioned,
    provisioned_2: bills[1].provisioned,
    dispensed_1: bills[0].actualDispense,
    dispensed_2: bills[1].actualDispense,
    rejected_1: bills[0].rejected,
    rejected_2: bills[1].rejected,
    denomination_1: bills[0].denomination,
    denomination_2: bills[1].denomination
  }

  return dispense
}

function logDispense (tx) {
  const baseRec = {error: tx.error, errorCode: tx.errorCode}
  const rec = _.merge(mapDispense(tx), baseRec)

  return logAction('dispense', rec, tx)
}

function logActionById (action, _rec, txId) {
  const rec = _.assign(_rec, {action, tx_id: txId, redeem: false})
  const sql = pgp.helpers.insert(rec, null, 'cash_out_actions')

  return db.none(sql)
}

function logAction (action, _rec, tx) {
  const rec = _.assign(_rec, {action, tx_id: tx.id, redeem: tx.redeem})
  const sql = pgp.helpers.insert(rec, null, 'cash_out_actions')

  return db.none(sql)
  .then(_.constant(tx))
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

  newObj.direction = 'cashOut'

  return newObj
}

function upsert (oldTx, tx) {
  if (!oldTx) {
    return insert(tx)
    .then(newTx => [oldTx, newTx])
  }

  return update(tx, diff(oldTx, tx))
  .then(newTx => [oldTx, newTx])
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

function convertField (key) {
  return _.snakeCase(key)
}

function toDb (tx) {
  const massager = _.flow(convertBigNumFields, _.omit(['direction', 'bills']), _.mapKeys(convertField))
  return massager(tx)
}

function insert (tx) {
  const dbTx = toDb(tx)

  const sql = pgp.helpers.insert(dbTx, null, 'cash_out_txs') + ' returning *'
  return db.one(sql)
  .then(toObj)
}

function update (tx, changes) {
  if (_.isEmpty(changes)) return Promise.resolve(tx)

  const dbChanges = toDb(tx)
  const sql = pgp.helpers.update(dbChanges, null, 'cash_out_txs') +
    pgp.as.format(' where id=$1', [tx.id])

  const newTx = _.merge(tx, changes)

  return db.none(sql)
  .then(() => newTx)
}

function nextHd (isHd, tx) {
  console.log('DEBUG160: %s', isHd)
  if (!isHd) return Promise.resolve(tx)
  console.log('DEBUG161: %s', isHd)

  return db.one("select nextval('hd_indices_seq') as hd_index")
  .then(row => _.set('hdIndex', row.hd_index, tx))
}

function preProcess (oldTx, newTx, pi) {
  if (!oldTx) {
    return pi.isHd(newTx)
    .then(isHd => nextHd(isHd, newTx))
    .then(newTxHd => {
      return pi.newAddress(newTxHd)
      .then(_.set('toAddress', _, newTxHd))
    })
    .then(addressedTx => {
      const rec = {toAddress: addressedTx.toAddress}
      return logAction('provisionAddress', rec, addressedTx)
    })
    .catch(err => {
      return logError('provisionAddress', err)
      .then(() => { throw err })
    })
  }

  return Promise.resolve(updateStatus(oldTx, newTx))
  .then(updatedTx => {
    if (!oldTx) return updatedTx

    if (updatedTx.status !== oldTx.status) {
      return logAction(updatedTx.status, {}, updatedTx)
    }

    if (_.isNil(oldTx.dispenseConfirmed) && _.isBoolean(updatedTx.dispenseConfirmed)) {
      return logDispense(updatedTx)
      .then(pi.updateCassettes(updatedTx))
    }

    if (!oldTx.phone && newTx.phone) {
      return logAction('addPhone', {}, updatedTx)
    }

    if (!oldTx.redeem && newTx.redeem) {
      return logAction('redeemLater', {}, updatedTx)
    }

    return updatedTx
  })
}

function postProcess (txVector, pi) {
  const [, newTx] = txVector

  if (newTx.dispensed && !newTx.bills) {
    return pi.buildCartridges()
    .then(cartridges => {
      pi.sell(newTx)
      return _.set('bills', billMath.makeChange(cartridges.cartridges, newTx.fiat), newTx)
    })
    .then(tx => {
      const rec = {provisioned_1: tx.bills[0], provisioned_2: tx.bills[1]}
      return logAction('provisionNotes', rec, tx)
    })
    .catch(err => {
      return logError('provisionNotes', err)
      .then(() => { throw err })
    })
  }

  return Promise.resolve(newTx)
}

function updateStatus (oldTx, newTx) {
  const tx = _.set('status', ratchetStatus(oldTx.status, newTx.status), newTx)
  const isConfirmed = _.includes(tx.status, ['instant', 'confirmed'])

  if (tx.status === oldTx.status || !isConfirmed) return tx

  return _.set('confirmationTime', 'now()^', tx)
}

function ratchetStatus (oldStatus, newStatus) {
  const statusOrder = ['notSeen', 'published', 'rejected',
    'authorized', 'instant', 'confirmed']

  if (oldStatus === newStatus) return oldStatus
  if (newStatus === 'insufficientFunds') return newStatus

  const idx = Math.max(statusOrder.indexOf(oldStatus), statusOrder.indexOf(newStatus))
  return statusOrder[idx]
}

function fetchOpenTxs (statuses, age) {
  const sql = `select *
  from cash_out_txs
  where ((extract(epoch from (now() - created))) * 1000)<$1
  and status in ($2^)`

  const statusClause = _.map(pgp.as.text, statuses).join(',')

  return db.any(sql, [age, statusClause])
  .then(rows => rows.map(toObj))
}

function processTxStatus (tx, settings) {
  const pi = plugins(settings, tx.deviceId)

  return pi.getStatus(tx)
  .then(res => _.set('status', res.status, tx))
  .then(_tx => post(_tx, pi))
}

function monitorLiveIncoming (settings) {
  const statuses = ['notSeen', 'published', 'insufficientFunds']

  return fetchOpenTxs(statuses, STALE_LIVE_INCOMING_TX_AGE)
  .then(txs => Promise.all(txs.map(tx => processTxStatus(tx, settings))))
  .catch(logger.error)
}

function monitorStaleIncoming (settings) {
  const statuses = ['notSeen', 'published', 'authorized', 'instant', 'rejected', 'insufficientFunds']

  return fetchOpenTxs(statuses, STALE_INCOMING_TX_AGE)
  .then(txs => Promise.all(txs.map(tx => processTxStatus(tx, settings))))
  .catch(logger.error)
}

function monitorUnnotified (settings) {
  const sql = `select *
  from cash_out_txs
  where ((extract(epoch from (now() - created))) * 1000)<$1
  and notified=$2 and dispensed=$3
  and phone is not null
  and status in ('instant', 'confirmed')
  and (redeem=$4 or ((extract(epoch from (now() - created))) * 1000)>$5)`

  const notify = tx => plugins(settings, tx.deviceId).notifyConfirmation(tx)
  return db.any(sql, [MAX_NOTIFY_AGE, false, false, true, MIN_NOTIFY_AGE])
  .then(rows => _.map(toObj, rows))
  .then(txs => Promise.all(txs.map(notify)))
  .catch(logger.error)
}

function cancel (txId) {
  const updateRec = {
    'dispense_time': 'now()^',
    error: 'Operator cancel',
    dispensed: true
  }

  return Promise.resolve()
  .then(() => {
    return pgp.helpers.update(updateRec, null, 'cash_out_txs') +
      pgp.as.format(' where id=$1', [txId])
  })
  .then(sql => db.result(sql, false))
  .then(res => {
    if (res.rowCount !== 1) throw new Error('No such tx-id')
  })
  .then(() => logActionById('operatorCompleted', {}, txId))
}
