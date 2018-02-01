const _ = require('lodash/fp')
const pgp = require('pg-promise')()

const db = require('./db')
const billMath = require('./bill-math')
const T = require('./time')
const logger = require('./logger')
const plugins = require('./plugins')
const helper = require('./cash-out-helper')
const socket = require('./socket-client')
const E = require('./error')

module.exports = {
  post,
  monitorLiveIncoming,
  monitorStaleIncoming,
  monitorUnnotified,
  cancel
}

const UPDATEABLE_FIELDS = ['txHash', 'txVersion', 'status', 'dispense', 'dispenseConfirmed',
  'notified', 'redeem', 'phone', 'error', 'swept', 'publishedAt', 'confirmedAt']

const STALE_INCOMING_TX_AGE = T.week
const STALE_LIVE_INCOMING_TX_AGE = 10 * T.minutes
const MAX_NOTIFY_AGE = 2 * T.days
const MIN_NOTIFY_AGE = 5 * T.minutes
const INSUFFICIENT_FUNDS_CODE = 570

const toObj = helper.toObj
const toDb = helper.toDb

function httpError (msg, code) {
  const err = new Error(msg)
  err.name = 'HTTPError'
  err.code = code || 500

  return err
}

function selfPost (tx, pi) {
  return post(tx, pi, false)
}

function post (tx, pi, fromClient = true) {
  const TransactionMode = pgp.txMode.TransactionMode
  const isolationLevel = pgp.txMode.isolationLevel
  const tmSRD = new TransactionMode({tiLevel: isolationLevel.serializable})

  function transaction (t) {
    const sql = 'select * from cash_out_txs where id=$1'

    return t.oneOrNone(sql, [tx.id])
    .then(toObj)
    .then(oldTx => {
      const isStale = fromClient && oldTx && (oldTx.txVersion >= tx.txVersion)
      if (isStale) throw new E.StaleTxError('Stale tx')

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

function logError (action, err, tx) {
  return logAction(action, {
    error: err.message,
    error_code: err.name
  }, tx)
}

function mapDispense (tx) {
  const bills = tx.bills

  if (_.isEmpty(bills)) return {}

  return {
    provisioned_1: bills[0].provisioned,
    provisioned_2: bills[1].provisioned,
    dispensed_1: bills[0].dispensed,
    dispensed_2: bills[1].dispensed,
    rejected_1: bills[0].rejected,
    rejected_2: bills[1].rejected,
    denomination_1: bills[0].denomination,
    denomination_2: bills[1].denomination
  }
}

function logDispense (tx) {
  const baseRec = {error: tx.error, error_code: tx.errorCode}
  const rec = _.merge(mapDispense(tx), baseRec)
  const action = _.isEmpty(tx.error) ? 'dispense' : 'dispenseError'
  return logAction(action, rec, tx)
}

function logActionById (action, _rec, txId) {
  const rec = _.assign(_rec, {action, tx_id: txId, redeem: false})
  const sql = pgp.helpers.insert(rec, null, 'cash_out_actions')

  return db.none(sql)
}

function logAction (action, _rec, tx) {
  const rec = _.assign(_rec, {action, tx_id: tx.id, redeem: !!tx.redeem})
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

function upsert (oldTx, tx) {
  if (!oldTx) {
    return insert(tx)
    .then(newTx => [oldTx, newTx])
  }

  return update(tx, diff(oldTx, tx))
  .then(newTx => [oldTx, newTx])
}

function insert (tx) {
  const dbTx = toDb(tx)

  const sql = pgp.helpers.insert(dbTx, null, 'cash_out_txs') + ' returning *'
  return db.one(sql)
  .then(toObj)
}

function update (tx, changes) {
  if (_.isEmpty(changes)) return Promise.resolve(tx)

  const dbChanges = toDb(changes)
  const sql = pgp.helpers.update(dbChanges, null, 'cash_out_txs') +
    pgp.as.format(' where id=$1', [tx.id])

  const newTx = _.merge(tx, changes)

  return db.none(sql)
  .then(() => newTx)
}

function nextHd (isHd, tx) {
  if (!isHd) return Promise.resolve(tx)

  return db.one("select nextval('hd_indices_seq') as hd_index")
  .then(row => _.set('hdIndex', row.hd_index, tx))
}

function dispenseOccurred (bills) {
  if (!bills) return false
  return _.every(_.overEvery([_.has('dispensed'), _.has('rejected')]), bills)
}

function updateCassettes (tx) {
  if (!dispenseOccurred(tx.bills)) return Promise.resolve()

  const sql = `update devices set
  cassette1 = cassette1 - $1,
  cassette2 = cassette2 - $2
  where device_id = $3
  returning cassette1, cassette2`

  const values = [
    tx.bills[0].dispensed + tx.bills[0].rejected,
    tx.bills[1].dispensed + tx.bills[1].rejected,
    tx.deviceId
  ]

  return db.one(sql, values)
  .then(r => socket.emit(_.assign(r, {op: 'cassetteUpdate', deviceId: tx.deviceId})))
}

function wasJustAuthorized (oldTx, newTx, isZeroConf) {
  const isAuthorized = () => _.includes(oldTx.status, ['notSeen', 'published']) &&
    _.includes(newTx.status, ['authorized', 'instant', 'confirmed'])

  const isConfirmed = () => _.includes(oldTx.status, ['notSeen', 'published', 'authorized']) &&
    _.includes(newTx.status, ['instant', 'confirmed'])

  return isZeroConf ? isAuthorized() : isConfirmed()
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
      const rec = {to_address: addressedTx.toAddress}
      return logAction('provisionAddress', rec, addressedTx)
    })
    .catch(err => {
      return logError('provisionAddress', err, newTx)
      .then(() => { throw err })
    })
  }

  return Promise.resolve(updateStatus(oldTx, newTx))
  .then(updatedTx => {
    if (updatedTx.status !== oldTx.status) {
      const isZeroConf = pi.isZeroConf(updatedTx)
      if (wasJustAuthorized(oldTx, updatedTx, isZeroConf)) pi.sell(updatedTx)

      const rec = {
        to_address: updatedTx.toAddress,
        tx_hash: updatedTx.txHash
      }

      return logAction(updatedTx.status, rec, updatedTx)
    }

    const hasError = !oldTx.error && newTx.error
    const hasDispenseOccurred = !dispenseOccurred(oldTx.bills) && dispenseOccurred(newTx.bills)

    if (hasError || hasDispenseOccurred) {
      return logDispense(updatedTx)
      .then(updateCassettes(updatedTx))
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
  const [oldTx, newTx] = txVector

  if ((newTx.dispense && !oldTx.dispense) || (newTx.redeem && !oldTx.redeem)) {
    return pi.buildAvailableCassettes(newTx.id)
    .then(cassettes => {
      const bills = billMath.makeChange(cassettes.cassettes, newTx.fiat)

      if (!bills) throw httpError('Out of bills', INSUFFICIENT_FUNDS_CODE)
      return bills
    })
    .then(bills => {
      const provisioned1 = bills[0].provisioned
      const provisioned2 = bills[1].provisioned
      const denomination1 = bills[0].denomination
      const denomination2 = bills[1].denomination

      const rec = {
        provisioned_1: provisioned1,
        provisioned_2: provisioned2,
        denomination_1: denomination1,
        denomination_2: denomination2
      }

      return logAction('provisionNotes', rec, newTx)
      .then(_.constant({bills}))
    })
    .catch(err => {
      return logError('provisionNotesError', err, newTx)
      .then(() => { throw err })
    })
  }

  return Promise.resolve({})
}

function isPublished (status) {
  return _.includes(status, ['published', 'rejected', 'authorized', 'instant', 'confirmed'])
}

function isConfirmed (status) {
  return status === 'confirmed'
}

function updateStatus (oldTx, newTx) {
  const oldStatus = oldTx.status
  const newStatus = ratchetStatus(oldStatus, newTx.status)

  const publishedAt = !oldTx.publishedAt && isPublished(newStatus)
  ? 'now()^'
  : undefined

  const confirmedAt = !oldTx.confirmedAt && isConfirmed(newStatus)
  ? 'now()^'
  : undefined

  const updateRec = {
    publishedAt,
    confirmedAt,
    status: newStatus
  }

  return _.merge(newTx, updateRec)
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
  .then(res => _.assign(tx, {status: res.status}))
  .then(_tx => selfPost(_tx, pi))
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
  and notified=$2 and dispense=$3
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
    error: 'Operator cancel',
    error_code: 'operatorCancel',
    dispense: true
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
