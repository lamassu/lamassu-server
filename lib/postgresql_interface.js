// @flow weak
'use strict'

const BigNumber = require('bignumber.js')
const pgp = require('pg-promise')()
const backoff = require('u-promised').backoff

const logger = require('./logger')

const CACHED_SESSION_TTL = 60 * 60 * 1000
const LIVE_SWEEP_TTL = 48 * 60 * 60 * 1000

let db

function isUniqueViolation (err) {
  return err.code === '23505'
}

function getInsertQuery (tableName, fields) {
  // outputs string like: '$1, $2, $3...' with proper No of items
  const placeholders = fields.map(function (_, i) {
    return '$' + (i + 1)
  }).join(', ')

  const query = 'INSERT INTO ' + tableName +
    ' (' + fields.join(', ') + ')' +
    ' VALUES' +
    ' (' + placeholders + ')'

  return query
}

exports.init = function init (conString) {
  if (!conString) {
    throw new Error('Postgres connection string is required')
  }

  db = pgp(conString)

  setInterval(pruneCachedResponses, CACHED_SESSION_TTL)
}

// logs inputted bill and overall tx status (if available)
exports.recordBill = function recordBill (session, rec) {
  const fields = [
    'id',
    'device_fingerprint',
    'currency_code',
    'crypto_code',
    'to_address',
    'session_id',
    'device_time',
    'satoshis',
    'denomination'
  ]

  const values = [
    rec.uuid,
    session.fingerprint,
    rec.currency,
    rec.cryptoCode,
    rec.toAddress,
    session.id,
    rec.deviceTime,
    rec.cryptoAtoms.toString(),
    rec.fiat
  ]

  return db.none(getInsertQuery('bills', fields), values)
  .catch(err => {
    if (isUniqueViolation(err)) return logger.warn('Attempt to report bill twice')
    throw err
  })
}

exports.recordDeviceEvent = function recordDeviceEvent (session, event) {
  const sql = 'INSERT INTO device_events (device_fingerprint, event_type, ' +
    'note, device_time) VALUES ($1, $2, $3, $4)'
  const values = [session.fingerprint, event.eventType, event.note,
    event.deviceTime]
  return db.none(sql, values)
}

exports.addOutgoingTx = function addOutgoingTx (session, tx) {
  const fields = ['session_id', 'device_fingerprint', 'to_address',
    'crypto_atoms', 'crypto_code', 'currency_code', 'fiat', 'tx_hash',
    'fee', 'phone', 'error'
  ]

  const values = [
    session.id,
    session.fingerprint,
    tx.toAddress,
    tx.cryptoAtoms.toString(),
    tx.cryptoCode,
    tx.currencyCode,
    tx.fiat,
    tx.txHash,
    null,
    tx.phone,
    tx.error
  ]

  return db.none(getInsertQuery('cash_in_txs', fields), values)
}

exports.sentCoins = function sentCoins (session, tx, toSend, fee, error, txHash) {
  const sql = `update cash_in_txs set tx_hash=$1, error=$2 where session_id=$3`
  return db.none(sql, [txHash, error, session.id])
}

exports.addInitialIncoming = function addInitialIncoming (session, tx) {
  const fields = ['session_id', 'device_fingerprint', 'to_address',
    'crypto_atoms', 'crypto_code', 'currency_code', 'fiat', 'tx_hash',
    'phone', 'error'
  ]

  const values = [
    session.id,
    session.fingerprint,
    tx.toAddress,
    tx.cryptoAtoms.toString(),
    tx.cryptoCode,
    tx.currencyCode,
    tx.fiat,
    tx.txHash,
    tx.phone,
    tx.error
  ]

  return db.none(getInsertQuery('cash_out_txs', fields), values)
}

function insertDispense (session, tx, cartridges) {
  const fields = [
    'device_fingerprint', 'session_id',
    'dispense1', 'reject1', 'count1',
    'dispense2', 'reject2', 'count2',
    'refill', 'error'
  ]

  const sql = getInsertQuery('dispenses', fields)

  const dispense1 = tx.bills[0].actualDispense
  const dispense2 = tx.bills[1].actualDispense
  const reject1 = tx.bills[0].rejected
  const reject2 = tx.bills[1].rejected
  const count1 = cartridges[0].count
  const count2 = cartridges[1].count
  const values = [
    session.fingerprint, tx.sessionId,
    dispense1, reject1, count1, dispense2, reject2, count2,
    false, tx.error
  ]

  return db.none(sql, values)
}

exports.addIncomingPhone = function addIncomingPhone (session, tx, notified) {
  const sql = `UPDATE cash_out_txs SET phone=$1, notified=$2
    WHERE session_id=$3
    AND phone IS NULL`
  const values = [tx.phone, notified, session.fingerprint, tx.sessionId]

  return db.result(sql, values)
  .then(results => {
    const noPhone = results.rowCount === 0
    const sql2 = 'insert into cash_out_actions (session_id, action) values ($1, $2)'

    if (noPhone) return {noPhone: noPhone}

    return db.none(sql2, [tx.sessionId, 'addedPhone'])
    .then(() => ({noPhone: noPhone}))
  })
}

function normalizeTx (tx) {
  tx.toAddress = tx.to_address
  tx.currencyCode = tx.currency_code
  tx.txHash = tx.tx_hash
  tx.cryptoCode = tx.crypto_code
  tx.cryptoAtoms = new BigNumber(tx.crypto_atoms)
  tx.sessionId = tx.session_id

  tx.to_address = undefined
  tx.currency_code = undefined
  tx.tx_hash = undefined
  tx.crypto_code = undefined
  tx.satoshis = undefined
  tx.session_id = undefined

  return tx
}

function normalizeTxs (txs) {
  return txs.map(normalizeTx)
}

exports.fetchPhoneTxs = function fetchPhoneTxs (phone, dispenseTimeout) {
  const sql = 'SELECT * FROM cash_out_txs ' +
    'WHERE phone=$1 AND dispensed=$2 ' +
    'AND (EXTRACT(EPOCH FROM (COALESCE(confirmation_time, now()) - created))) * 1000 < $3'

  const values = [phone, false, dispenseTimeout]

  return db.any(sql, values)
  .then(rows => normalizeTxs(rows))
}

exports.fetchTx = function fetchTx (session) {
  const sql = 'SELECT * FROM cash_out_txs WHERE session_id=$1'

  return db.one(sql, [session.id])
  .then(row => normalizeTx(row))
}

exports.addDispenseRequest = function addDispenseRequest (tx) {
  const sql = 'update cash_out_txs set dispensed=$1 where session_id=$2 and dispensed=$3'
  const values = [true, tx.sessionId, false]

  return db.result(sql, values)
  .then(results => {
    const alreadyDispensed = results.rowCount === 0
    if (alreadyDispensed) return {dispense: false, reason: 'alreadyDispensed'}

    const sql2 = 'insert into cash_out_actions (session_id, action) values ($1, $2)'

    return db.none(sql2, [tx.sessionId, 'dispenseRequested'])
    .then(() => ({dispense: true}))
  })
}

exports.addDispense = function addDispense (session, tx, cartridges) {
  return insertDispense(session, tx, cartridges)
  .then(() => {
    const sql2 = 'insert into cash_out_actions (session_id, action) values ($1, $2)'

    return db.none(sql2, [tx.sessionId, 'dispensed'])
  })
}

exports.cartridgeCounts = function cartridgeCounts (session) {
  const sql = 'SELECT id, count1, count2 FROM dispenses ' +
    'WHERE device_fingerprint=$1 AND refill=$2 ' +
    'ORDER BY id DESC LIMIT 1'
  return db.oneOrNone(sql, [session.fingerprint, true])
  .then(row => {
    const counts = row ? [row.count1, row.count2] : [0, 0]
    return {id: row.id, counts: counts}
  })
}

exports.machineEvent = function machineEvent (rec) {
  const TTL = 2 * 60 * 60 * 1000
  const fields = ['id', 'device_fingerprint', 'event_type', 'note', 'device_time']
  const sql = getInsertQuery('machine_events', fields)
  const values = [rec.id, rec.fingerprint, rec.eventType, rec.note, rec.deviceTime]
  const deleteSql = 'DELETE FROM machine_events WHERE (EXTRACT(EPOCH FROM (now() - created))) * 1000 > $1'
  const deleteValues = [TTL]

  return db.none(sql, values)
  .then(() => db.none(deleteSql, deleteValues))
}

exports.devices = function devices () {
  const sql = 'SELECT fingerprint, name FROM devices WHERE authorized=$1'
  return db.any(sql, [true])
}

exports.machineEvents = function machineEvents () {
  const sql = 'SELECT *, (EXTRACT(EPOCH FROM (now() - created))) * 1000 AS age FROM machine_events'
  return db.any(sql, [])
}

function singleQuotify (item) { return '\'' + item + '\'' }

exports.fetchOpenTxs = function fetchOpenTxs (statuses, age) {
  const _statuses = '(' + statuses.map(singleQuotify).join(',') + ')'

  const sql = 'SELECT * ' +
  'FROM cash_out_txs ' +
  'WHERE ((EXTRACT(EPOCH FROM (now() - created))) * 1000)<$1 ' +
  'AND status IN ' + _statuses

  return db.any(sql, [age])
  .then(rows => normalizeTxs(rows))
}

exports.fetchUnnotifiedTxs = function fetchUnnotifiedTxs (age, waitPeriod) {
  const sql = `SELECT *
  FROM cash_out_txs
  WHERE ((EXTRACT(EPOCH FROM (now() - created))) * 1000)<$1
  AND notified=$2 AND dispensed=$3
  AND phone IS NOT NULL
  AND status IN ('instant', 'confirmed')
  AND (redeem=$4 OR ((EXTRACT(EPOCH FROM (now() - created))) * 1000)>$5)`

  return db.any(sql, [age, false, false, true, waitPeriod])
  .then(rows => normalizeTxs(rows))
}

function ratchetStatus (oldStatus, newStatus) {
  const statusOrder = ['notSeen', 'published', 'rejected',
    'authorized', 'instant', 'confirmed']

  if (oldStatus === newStatus) return oldStatus
  if (newStatus === 'insufficientFunds') return newStatus

  const idx = Math.max(statusOrder.indexOf(oldStatus), statusOrder.indexOf(newStatus))
  return statusOrder[idx]
}

exports.updateTxStatus = function updateTxStatus (tx, status) {
  const TransactionMode = pgp.txMode.TransactionMode
  const isolationLevel = pgp.txMode.isolationLevel
  const tmSRD = new TransactionMode({tiLevel: isolationLevel.serializable})

  function transaction (t) {
    const sql = 'select status, confirmation_time from cash_out_txs where session_id=$1'
    return t.one(sql, [tx.sessionId])
    .then(row => {
      const newStatus = ratchetStatus(row.status, status)
      if (row.status === newStatus) return

      const setConfirmationTime = !row.confirmation_time &&
        (newStatus === 'instant' || newStatus === 'confirmed')

      const sql2 = setConfirmationTime
      ? 'UPDATE cash_out_txs SET status=$1, confirmation_time=now() WHERE session_id=$2'
      : 'UPDATE cash_out_txs SET status=$1 WHERE session_id=$2'

      const values2 = [newStatus, tx.sessionId]

      return t.none(sql2, values2)
      .then(() => ({status: newStatus}))
    })
  }

  transaction.txMode = tmSRD

  // Note: don't worry about retrying failed transaction here
  // It will be tried again on the next status check
  return db.tx(transaction)
  .then(r => {
    if (!r) return

    const sql3 = 'insert into cash_out_actions (session_id, action) values ($1, $2)'
    return db.none(sql3, [tx.sessionId, r.status])
    .then(() => {
      if (r.status === 'confirmed') {
        const sql4 = `update cash_out_hds set confirmed=true where session_id=$1`
        return db.none(sql4, [tx.sessionId])
      }
    })
  })
}

exports.updateRedeem = function updateRedeem (session) {
  const sql = 'UPDATE cash_out_txs SET redeem=$1 WHERE session_id=$2'
  const values = [true, session.id]

  return db.none(sql, values)
  .then(() => {
    const sql2 = 'insert into cash_out_actions (session_id, action) values ($1, $2)'
    return db.none(sql2, [session.id, 'redeem'])
  })
}

exports.updateNotify = function updateNotify (tx) {
  const sql = 'UPDATE cash_out_txs SET notified=$1 WHERE session_id=$2'
  const values = [true, tx.sessionId]

  return db.none(sql, values)
  .then(() => {
    const sql2 = 'insert into cash_out_actions (session_id, action) values ($1, $2)'
    return db.none(sql2, [tx.sessionId, 'notified'])
  })
}

function insertCachedRequest (session, path, method, body) {
  const fields = [
    'device_fingerprint',
    'session_id',
    'path',
    'method',
    'body'
  ]

  const sql = getInsertQuery('cached_responses', fields)
  return db.none(sql, [session.fingerprint, session.id, path, method, body])
}

exports.cachedResponse = function (session, path, method) {
  const sql = `select body from cached_responses
  where device_fingerprint=$1
  and session_id=$2
  and path=$3
  and method=$4`

  const values = [session.fingerprint, session.id, path, method]

  return insertCachedRequest(session, path, method, {pendingRequest: true})
  .then(() => ({}))
  .catch(err => {
    if (!isUniqueViolation(err)) throw err
    return db.one(sql, values)
    .then(row => ({body: row.body}))
  })
}

function pruneCachedResponses () {
  const sql = `delete from cached_responses
  where (EXTRACT(EPOCH FROM (now() - created))) * 1000 < $1`

  const values = [CACHED_SESSION_TTL]

  return db.none(sql, values)
}

exports.cacheResponse = function (session, path, method, body) {
  const sql = `update cached_responses
  set body=$1
  where device_fingerprint=$2
  and session_id=$3
  and path=$4
  and method=$5`

  const values = [body, session.fingerprint, session.id, path, method]

  return db.none(sql, values)
}

exports.nextCashOutSerialHD = function nextCashOutSerialHD (sessionId, cryptoCode) {
  const sql = `select hd_serial from cash_out_hds
    where crypto_code=$1 order by hd_serial desc limit 1`
  const attempt = () => db.oneOrNone(sql, [cryptoCode])
  .then(row => {
    const serialNumber = row ? row.hd_serial + 1 : 0
    const fields2 = ['session_id', 'crypto_code', 'hd_serial']
    const sql2 = getInsertQuery('cash_out_hds', fields2)
    const values2 = [sessionId, cryptoCode, serialNumber]
    return db.none(sql2, values2)
    .then(() => serialNumber)
  })

  return backoff(100, 0, 5, attempt)
}

exports.fetchLiveHD = function fetchLiveHD () {
  const sql = `select * from cash_out_txs, cash_out_hds
    where cash_out_txs.session_id=cash_out_hds.session_id
    and status=$1 and swept=$2 and
    ((extract(epoch from (now() - cash_out_txs.created))) * 1000)<$3`

  const values = ['confirmed', false, LIVE_SWEEP_TTL]

  return db.any(sql, values)
}

exports.fetchOldHD = function fetchLiveHD () {
  const sql = `select * from cash_out_hds
    where confirmed
    order by last_checked
    limit 10`

  return db.any(sql)
}

exports.markSwept = function markSwept (sessionId) {
  const sql = `update cash_out_hds set swept=$1 where session_id=$2`
  return db.none(sql, [true, sessionId])
}
