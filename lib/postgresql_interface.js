// @flow weak
'use strict'

const BigNumber = require('bignumber.js')
const pgp = require('pg-promise')()
var psqlUrl = require('../lib/options').postgresql
const backoff = require('u-promised').backoff

const logger = require('./logger')

const CACHED_SESSION_TTL = 60 * 60 * 1000
const LIVE_SWEEP_TTL = 48 * 60 * 60 * 1000

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

function connect () {
  return pgp(psqlUrl)
}

// logs inputted bill and overall tx status (if available)
exports.recordBill = function recordBill (deviceId, rec) {
  console.log('DEBUG10: %j', rec)
  const fields = [
    'id',
    'device_id',
    'currency_code',
    'crypto_code',
    'to_address',
    'cash_in_txs_id',
    'device_time',
    'crypto_atoms',
    'denomination'
  ]

  const values = [
    rec.uuid,
    deviceId,
    rec.currency,
    rec.cryptoCode,
    rec.toAddress,
    rec.txId,
    rec.deviceTime,
    rec.cryptoAtoms.toString(),
    rec.fiat
  ]

  console.log('DEBUG11: %j', values)

  const db = connect()

  return db.none(getInsertQuery('bills', fields), values)
  .catch(err => {
    if (isUniqueViolation(err)) return logger.warn('Attempt to report bill twice')
    throw err
  })
}

exports.recordDeviceEvent = function recordDeviceEvent (deviceId, event) {
  const sql = 'INSERT INTO device_events (device_id, event_type, ' +
    'note, device_time) VALUES ($1, $2, $3, $4)'
  const values = [deviceId, event.eventType, event.note,
    event.deviceTime]
  const db = connect()

  return db.none(sql, values)
}

// NOTE: This will fail if we have already sent coins because there will be
// a unique cash_in_txs record in the table already keyed by txId.
exports.addOutgoingTx = function addOutgoingTx (deviceId, tx) {
  const fields = ['id', 'device_id', 'to_address',
    'crypto_atoms', 'crypto_code', 'currency_code', 'fiat', 'tx_hash',
    'fee', 'phone', 'error'
  ]

  const values = [
    tx.id,
    deviceId,
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

  const db = connect()
  return db.none(getInsertQuery('cash_in_txs', fields), values)
}

exports.sentCoins = function sentCoins (tx, toSend, fee, error, txHash) {
  const sql = 'update cash_in_txs set tx_hash=$1, error=$2 where id=$3'
  const db = connect()
  return db.none(sql, [txHash, error, tx.id])
}

exports.addInitialIncoming = function addInitialIncoming (deviceId, tx) {
  const fields = ['id', 'device_id', 'to_address',
    'crypto_atoms', 'crypto_code', 'currency_code', 'fiat', 'tx_hash',
    'phone', 'error'
  ]

  const values = [
    tx.id,
    deviceId,
    tx.toAddress,
    tx.cryptoAtoms.toString(),
    tx.cryptoCode,
    tx.currencyCode,
    tx.fiat,
    tx.txHash,
    tx.phone,
    tx.error
  ]

  const db = connect()
  return db.none(getInsertQuery('cash_out_txs', fields), values)
}

function insertDispense (deviceId, tx, cartridges) {
  const fields = [
    'device_id', 'cash_out_txs_id',
    'dispense1', 'reject1', 'count1',
    'dispense2', 'reject2', 'count2',
    'refill', 'error'
  ]

  const sql = getInsertQuery('dispenses', fields)

  console.log('DEBUG24: %j', tx)

  const dispense1 = tx.bills[0].actualDispense
  const dispense2 = tx.bills[1].actualDispense
  const reject1 = tx.bills[0].rejected
  const reject2 = tx.bills[1].rejected
  const count1 = cartridges[0].count
  const count2 = cartridges[1].count
  const values = [
    deviceId, tx.id,
    dispense1, reject1, count1, dispense2, reject2, count2,
    false, tx.error
  ]

  const db = connect()
  return db.none(sql, values)
}

exports.addIncomingPhone = function addIncomingPhone (tx, notified) {
  const sql = `UPDATE cash_out_txs SET phone=$1, notified=$2
    WHERE id=$3
    AND phone IS NULL`
  const values = [tx.phone, notified, tx.id]
  const db = connect()

  return db.result(sql, values)
  .then(results => {
    const noPhone = results.rowCount === 0
    const sql2 = 'insert into cash_out_actions (cash_out_txs_id, action) values ($1, $2)'

    if (noPhone) return {noPhone: noPhone}

    return db.none(sql2, [tx.id, 'addedPhone'])
    .then(() => ({noPhone: noPhone}))
  })
}

function normalizeTx (tx) {
  tx.toAddress = tx.to_address
  tx.currencyCode = tx.currency_code
  tx.txHash = tx.tx_hash
  tx.cryptoCode = tx.crypto_code
  tx.cryptoAtoms = new BigNumber(tx.crypto_atoms)

  tx.to_address = undefined
  tx.currency_code = undefined
  tx.tx_hash = undefined
  tx.crypto_code = undefined

  // Eventually turn this into BigDecimal, for now, integer
  tx.fiat = parseInt(tx.fiat, 10)

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
  const db = connect()

  return db.any(sql, values)
  .then(rows => normalizeTxs(rows))
}

exports.fetchTx = function fetchTx (txId) {
  const sql = 'SELECT * FROM cash_out_txs WHERE id=$1'
  const db = connect()

  return db.one(sql, [txId])
  .then(row => normalizeTx(row))
}

exports.addDispenseRequest = function addDispenseRequest (tx) {
  const sql = 'update cash_out_txs set dispensed=$1 where id=$2 and dispensed=$3'
  const values = [true, tx.id, false]
  const db = connect()

  return db.result(sql, values)
  .then(results => {
    const alreadyDispensed = results.rowCount === 0
    if (alreadyDispensed) return {dispense: false, reason: 'alreadyDispensed'}

    const sql2 = 'insert into cash_out_actions (cash_out_txs_id, action) values ($1, $2)'

    return db.none(sql2, [tx.id, 'dispenseRequested'])
    .then(() => ({dispense: true, txId: tx.id}))
  })
}

exports.addDispense = function addDispense (deviceId, tx, cartridges) {
  return insertDispense(deviceId, tx, cartridges)
  .then(() => {
    const sql2 = 'insert into cash_out_actions (cash_out_txs_id, action) values ($1, $2)'
    const db = connect()

    return db.none(sql2, [tx.id, 'dispensed'])
  })
}

exports.cartridgeCounts = function cartridgeCounts (deviceId) {
  const sql = 'SELECT id, count1, count2 FROM dispenses ' +
    'WHERE device_id=$1 AND refill=$2 ' +
    'ORDER BY id DESC LIMIT 1'
  const db = connect()

  return db.oneOrNone(sql, [deviceId, true])
  .then(row => {
    const counts = row ? [row.count1, row.count2] : [0, 0]
    return {id: row.id, counts: counts}
  })
}

exports.machineEvent = function machineEvent (rec) {
  const TTL = 2 * 60 * 60 * 1000
  const fields = ['id', 'device_id', 'event_type', 'note', 'device_time']
  const sql = getInsertQuery('machine_events', fields)
  const values = [rec.id, rec.deviceId, rec.eventType, rec.note, rec.deviceTime]
  const deleteSql = 'DELETE FROM machine_events WHERE (EXTRACT(EPOCH FROM (now() - created))) * 1000 > $1'
  const deleteValues = [TTL]
  const db = connect()

  return db.none(sql, values)
  .then(() => db.none(deleteSql, deleteValues))
}

exports.devices = function devices () {
  const sql = 'SELECT device_id, name FROM devices WHERE authorized=$1'
  const db = connect()

  return db.any(sql, [true])
}

exports.machineEvents = function machineEvents () {
  const sql = 'SELECT *, (EXTRACT(EPOCH FROM (now() - created))) * 1000 AS age FROM machine_events'
  const db = connect()

  return db.any(sql, [])
}

function singleQuotify (item) { return '\'' + item + '\'' }

exports.fetchOpenTxs = function fetchOpenTxs (statuses, age) {
  const _statuses = '(' + statuses.map(singleQuotify).join(',') + ')'

  const sql = 'SELECT * ' +
  'FROM cash_out_txs ' +
  'WHERE ((EXTRACT(EPOCH FROM (now() - created))) * 1000)<$1 ' +
  'AND status IN ' + _statuses
  const db = connect()

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
  const db = connect()

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
  const db = connect()

  function transaction (t) {
    const sql = 'select status, confirmation_time from cash_out_txs where id=$1'
    return t.one(sql, [tx.id])
    .then(row => {
      const newStatus = ratchetStatus(row.status, status)
      if (row.status === newStatus) return

      const setConfirmationTime = !row.confirmation_time &&
        (newStatus === 'instant' || newStatus === 'confirmed')

      const sql2 = setConfirmationTime
      ? 'UPDATE cash_out_txs SET status=$1, confirmation_time=now() WHERE id=$2'
      : 'UPDATE cash_out_txs SET status=$1 WHERE id=$2'

      const values2 = [newStatus, tx.id]

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

    const sql3 = 'insert into cash_out_actions (cash_out_txs_id, action) values ($1, $2)'
    return db.none(sql3, [tx.id, r.status])
    .then(() => {
      if (r.status === 'confirmed') {
        const sql4 = 'update cash_out_hds set confirmed=true where id=$1'
        return db.none(sql4, [tx.id])
      }
    })
  })
}

exports.updateRedeem = function updateRedeem (txId) {
  const sql = 'UPDATE cash_out_txs SET redeem=$1 WHERE id=$2'
  const values = [true, txId]
  const db = connect()

  return db.none(sql, values)
  .then(() => {
    const sql2 = 'insert into cash_out_actions (cash_out_txs_id, action) values ($1, $2)'
    return db.none(sql2, [txId, 'redeem'])
  })
}

exports.updateNotify = function updateNotify (tx) {
  const sql = 'UPDATE cash_out_txs SET notified=$1 WHERE id=$2'
  const values = [true, tx.id]
  const db = connect()

  return db.none(sql, values)
  .then(() => {
    const sql2 = 'insert into cash_out_actions (cash_out_txs_id, action) values ($1, $2)'
    return db.none(sql2, [tx.id, 'notified'])
  })
}

function insertCachedRequest (deviceId, txId, path, method, body) {
  const fields = [
    'device_id',
    'tx_id',
    'path',
    'method',
    'body'
  ]
  const db = connect()

  const sql = getInsertQuery('cached_responses', fields)
  return db.none(sql, [deviceId, txId, path, method, body])
}

exports.cachedResponse = function (deviceId, txId, path, method) {
  const sql = `select body from cached_responses
  where device_id=$1
  and tx_id=$2
  and path=$3
  and method=$4`

  const values = [deviceId, txId, path, method]
  const db = connect()

  return insertCachedRequest(deviceId, txId, path, method, {pendingRequest: true})
  .then(() => ({}))
  .catch(err => {
    if (!isUniqueViolation(err)) throw err
    console.log('DEBUG22: %j', err)
    return db.one(sql, values)
    .then(row => ({body: row.body}))
  })
}

function pruneCachedResponses () {
  const sql = `delete from cached_responses
  where (EXTRACT(EPOCH FROM (now() - created))) * 1000 < $1`

  const values = [CACHED_SESSION_TTL]
  const db = connect()

  return db.none(sql, values)
}

exports.cacheResponse = function (deviceId, txId, path, method, body) {
  const sql = `update cached_responses
  set body=$1
  where device_id=$2
  and tx_id=$3
  and path=$4
  and method=$5`

  const values = [body, deviceId, txId, path, method]
  const db = connect()

  return db.none(sql, values)
}

exports.nextCashOutSerialHD = function nextCashOutSerialHD (txId, cryptoCode) {
  const sql = `select hd_serial from cash_out_hds
    where crypto_code=$1 order by hd_serial desc limit 1`
  const db = connect()

  const attempt = () => db.oneOrNone(sql, [cryptoCode])
  .then(row => {
    const serialNumber = row ? row.hd_serial + 1 : 0
    const fields2 = ['id', 'crypto_code', 'hd_serial']
    const sql2 = getInsertQuery('cash_out_hds', fields2)
    const values2 = [txId, cryptoCode, serialNumber]
    return db.none(sql2, values2)
    .then(() => serialNumber)
  })

  return backoff(100, 0, 5, attempt)
}

exports.fetchLiveHD = function fetchLiveHD () {
  const sql = `select * from cash_out_txs, cash_out_hds
    where cash_out_txs.id=cash_out_hds.id
    and status=$1 and swept=$2 and
    ((extract(epoch from (now() - cash_out_txs.created))) * 1000)<$3`

  const values = ['confirmed', false, LIVE_SWEEP_TTL]
  const db = connect()

  return db.any(sql, values)
}

exports.fetchOldHD = function fetchLiveHD () {
  const sql = `select * from cash_out_hds
    where confirmed
    order by last_checked
    limit 10`
  const db = connect()

  return db.any(sql)
}

exports.markSwept = function markSwept (txId) {
  const sql = 'update cash_out_hds set swept=$1 where id=$2'
  const db = connect()

  return db.none(sql, [true, txId])
}

setInterval(pruneCachedResponses, CACHED_SESSION_TTL)
