'use strict'

// TODO: Consider using serializable transactions for true ACID

var BigNumber = require('bignumber.js')
var pg = require('pg')
var async = require('async')

var logger = require('./logger')

const CACHED_SESSION_TTL = 60 * 60 * 1000

/*
function inspect(rec) {
  console.log(require('util').inspect(rec, {depth: null, colors: true}))
}
*/

function isUniqueViolation (err) {
  return err.code === '23505'
}

function isLowSeverity (err) {
  return isUniqueViolation(err) || err.severity === 'low'
}

var conString = null

function getInsertQuery (tableName, fields, hasId) {
  // outputs string like: '$1, $2, $3...' with proper No of items
  var placeholders = fields.map(function (_, i) {
    return '$' + (i + 1)
  }).join(', ')

  var query = 'INSERT INTO ' + tableName +
    ' (' + fields.join(', ') + ')' +
    ' VALUES' +
    ' (' + placeholders + ')'

  if (hasId) query += ' RETURNING id'

  return query
}

exports.init = function init (_conString) {
  conString = _conString
  if (!conString) {
    throw new Error('Postgres connection string is required')
  }

  setInterval(pruneCachedResponses, CACHED_SESSION_TTL)
}

function connect (cb) {
  pg.connect(conString, function (err, client, done) {
    if (err) logger.error(err)
    cb(err, client, done)
  })
}

// logs inputted bill and overall tx status (if available)
exports.recordBill = function recordBill (session, rec, cb) {
  var fields = [
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

  var values = [
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

  connect(function (cerr, client, done) {
    if (cerr) return cb(cerr)
    query(client, getInsertQuery('bills', fields, false), values, function (err) {
      done()
      if (err && isUniqueViolation(err)) {
        logger.warn('Attempt to report bill twice')
        return cb()
      }
      cb(err)
    })
  })
}

exports.recordDeviceEvent = function recordDeviceEvent (session, event) {
  connect(function (cerr, client, done) {
    if (cerr) return
    var sql = 'INSERT INTO device_events (device_fingerprint, event_type, ' +
      'note, device_time) VALUES ($1, $2, $3, $4)'
    var values = [session.fingerprint, event.eventType, event.note,
      event.deviceTime]
    client.query(sql, values, done)
  })
}

function query (client, queryStr, values, cb) {
  if (!cb) {
    cb = values
    values = []
  }

  client.query(queryStr, values, function (err, results) {
    if (err) {
      if (!isLowSeverity(err)) {
        console.error(err)
        console.log(queryStr)
        console.log(values)
      }
      return cb(err)
    }
    cb(null, results)
  })
}

function insertIncoming (client, session, tx, cryptoAtoms, fiat, cb) {
  var fields = ['session_id', 'device_fingerprint', 'to_address',
    'crypto_atoms', 'crypto_code', 'currency_code', 'fiat', 'tx_hash',
    'phone', 'error'
  ]

  var values = [
    session.id,
    session.fingerprint,
    tx.toAddress,
    cryptoAtoms.toString(),
    tx.currencyCode,
    tx.cryptoCode,
    fiat,
    tx.txHash,
    tx.phone,
    tx.error
  ]

  query(client, getInsertQuery('cash_out_txs', fields), values, cb)
}

function insertOutgoing (client, session, tx, cryptoAtoms, fiat, cb) {
  var fields = ['session_id', 'device_fingerprint', 'to_address',
    'crypto_atoms', 'crypto_code', 'currency_code', 'fiat', 'tx_hash',
    'fee', 'phone', 'error'
  ]

  var values = [
    session.id,
    session.fingerprint,
    tx.toAddress,
    cryptoAtoms.toString(),
    tx.cryptoCode,
    tx.currencyCode,
    fiat,
    tx.txHash,
    null,
    tx.phone,
    tx.error
  ]

  query(client, getInsertQuery('cash_in_txs', fields), values, cb)
}

// Calling function should only send bitcoins if result.cryptoAtomsToSend > 0
exports.addOutgoingTx = function addOutgoingTx (session, tx, cb) {
  connect(function (cerr, client, done) {
    if (cerr) return cb(cerr)

    var cryptoAtoms = tx.cryptoAtoms
    var fiat = tx.fiat
    insertOutgoing(client, session, tx, cryptoAtoms, fiat, cb)
  })
}

exports.sentCoins = function sentCoins (session, tx, toSend, fee, error, txHash) {
  var sql = `update cash_in_txs set tx_hash=$1, error=$2 where session_id=$3`
  return pquery(sql, [txHash, error, session.id])
}

exports.addInitialIncoming = function addInitialIncoming (session, tx, cb) {
  connect(function (cerr, client, done) {
    if (cerr) return cb(cerr)
    insertIncoming(client, session, tx, tx.cryptoAtoms, tx.fiat, cb)
  })
}

function insertDispense (client, session, tx, cartridges, cb) {
  var fields = [
    'device_fingerprint', 'session_id',
    'dispense1', 'reject1', 'count1',
    'dispense2', 'reject2', 'count2',
    'refill', 'error'
  ]

  var sql = getInsertQuery('dispenses', fields)

  var dispense1 = tx.bills[0].actualDispense
  var dispense2 = tx.bills[1].actualDispense
  var reject1 = tx.bills[0].rejected
  var reject2 = tx.bills[1].rejected
  var count1 = cartridges[0].count
  var count2 = cartridges[1].count
  var values = [
    session.fingerprint, session.id,
    dispense1, reject1, count1, dispense2, reject2, count2,
    false, tx.error
  ]
  client.query(sql, values, cb)
}

exports.addIncomingPhone = function addIncomingPhone (session, tx, notified, cb) {
  var sql = 'UPDATE transactions SET phone=$1, notified=$2 ' +
    'WHERE device_fingerprint=$3 AND session_id=$4 ' +
    'AND phone IS NULL'

  return new Promise((resolve, reject) => {
    connect(function (cerr, client, done) {
      if (cerr) return reject(cerr)
      var values = [tx.phone, notified, session.fingerprint, tx.sessionId]
      query(client, sql, values, function (err, results) {
        done(err)
        if (err) return reject(err)
        resolve({noPhone: results.rowCount === 0})
      })
    })
  })
}

function normalizeTxs (txs) {
  return txs.map(function (tx) {
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
  })
}

exports.fetchPhoneTxs = function fetchPhoneTxs (phone, dispenseTimeout) {
  var sql = 'SELECT * FROM cash_out_txs ' +
    'WHERE phone=$1 AND dispensed=$2 ' +
    'AND (EXTRACT(EPOCH FROM (COALESCE(confirmation_time, now()) - created))) * 1000 < $3'

  var values = [phone, false, dispenseTimeout]

  return pquery(sql, values)
  .then(r => normalizeTxs(r.rows))
}

exports.fetchTx = function fetchTx (session) {
  var sql = 'SELECT * FROM cash_out_txs ' +
    'WHERE device_fingerprint=$1 AND session_id=$2'

  return new Promise((resolve, reject) => {
    connect(function (cerr, client, done) {
      if (cerr) return reject(cerr)
      var values = [session.fingerprint, session.id]
      query(client, sql, values, function (err, results) {
        done()
        if (err) return reject(err)
        resolve(normalizeTxs(results.rows)[0])
      })
    })
  })
}

exports.addDispenseRequest = function addDispenseRequest (session, tx) {
  return new Promise((resolve, reject) => {
    connect(function (cerr, client, done) {
      if (cerr) return reject(cerr)

      const originalSession = {id: tx.sessionId, fingerprint: session.fingerprint}
      async.waterfall([
        async.apply(updateDispense, client, originalSession, true),
        async.apply(insertIncoming, client, originalSession, tx, 0, tx.fiat)
      ], function (err) {
        done()

        if (err) return reject(err)
        resolve()
      })
    })
  })
}

function updateDispense (client, session, dispensed, cb) {
  var sql = 'UPDATE transactions SET dispensed=$1 ' +
    'WHERE device_fingerprint=$2 AND session_id=$3'
  var values = [dispensed, session.fingerprint, session.id]
  query(client, sql, values, function (err, results) {
    if (err) return cb(err)
    if (results.rowCount === 0) return cb(new Error('No pending tx'))
    cb()
  })
}

exports.addDispense = function addDispense (session, tx, cartridges) {
  connect(function (cerr, client, done) {
    if (cerr) return

    async.waterfall([
      async.apply(insertIncoming, client, session, tx, 0, tx.fiat),
      async.apply(insertDispense, client, session, tx, cartridges)
    ], function (err) {
      done()
      if (err) logger.error(err)
    })
  })
}

exports.cartridgeCounts = function cartridgeCounts (session, cb) {
  connect(function (cerr, client, done) {
    if (cerr) return cb(cerr)
    var sql = 'SELECT id, count1, count2 FROM dispenses ' +
      'WHERE device_fingerprint=$1 AND refill=$2 ' +
      'ORDER BY id DESC LIMIT 1'
    query(client, sql, [session.fingerprint, true], function (err, results) {
      done()
      if (err) return cb(err)
      var counts = results.rows.length === 1
        ? [results.rows[0].count1, results.rows[0].count2]
        : [0, 0]
      cb(null, {id: results.rows[0].id, counts: counts})
    })
  })
}

exports.machineEvent = function machineEvent (rec, cb) {
  var TTL = 2 * 60 * 60 * 1000
  connect(function (cerr, client, done) {
    if (cerr) return cb(cerr)
    var fields = ['id', 'device_fingerprint', 'event_type', 'note', 'device_time']
    var sql = getInsertQuery('machine_events', fields, false)
    var values = [rec.id, rec.fingerprint, rec.eventType, rec.note, rec.deviceTime]

    var deleteSql = 'DELETE FROM machine_events WHERE (EXTRACT(EPOCH FROM (now() - created))) * 1000 > $1'
    var deleteValues = [TTL]

    query(client, deleteSql, deleteValues, function (err) {
      if (err) console.error(err)
    })

    query(client, sql, values, function (err, results) {
      done()
      return cb(err, results)
    })
  })
}

exports.devices = function devices (cb) {
  connect(function (cerr, client, done) {
    if (cerr) return cb(cerr)
    var sql = 'SELECT fingerprint, name FROM devices ' +
      'WHERE authorized=$1'
    query(client, sql, [true], function (err, results) {
      done()
      if (err) return cb(err)
      cb(null, results)
    })
  })
}

exports.machineEvents = function machineEvents (cb) {
  connect(function (cerr, client, done) {
    if (cerr) return cb(cerr)
    var sql = 'SELECT *, (EXTRACT(EPOCH FROM (now() - created))) * 1000 AS age FROM machine_events'
    query(client, sql, [], function (err, results) {
      done()
      if (err) return cb(err)
      cb(null, results)
    })
  })
}

function singleQuotify (item) { return '\'' + item + '\'' }

exports.fetchOpenTxs = function fetchOpenTxs (statuses, age, cb) {
  var _statuses = '(' + statuses.map(singleQuotify).join(',') + ')'

  var sql = 'SELECT * ' +
  'FROM cash_out_txs ' +
  'WHERE ((EXTRACT(EPOCH FROM (now() - created))) * 1000)<$1 ' +
  'AND status IN ' + _statuses

  connect(function (cerr, client, done) {
    if (cerr) return cb(cerr)

    query(client, sql, [age], function (err, results) {
      done()
      if (err) return cb(err)
      cb(null, normalizeTxs(results.rows))
    })
  })
}

exports.fetchUnnotifiedTxs = function fetchUnnotifiedTxs (age, waitPeriod, cb) {
  var sql = 'SELECT * ' +
  'FROM transactions ' +
  'WHERE ((EXTRACT(EPOCH FROM (now() - created))) * 1000)<$1 ' +
  'AND notified=$2 AND dispensed=$3 ' +
  'AND phone IS NOT NULL ' +
  "AND status IN ('instant', 'confirmed') " +
  'AND (redeem=$4 OR ((EXTRACT(EPOCH FROM (now() - created))) * 1000)>$5)'

  connect(function (cerr, client, done) {
    if (cerr) return cb(cerr)

    var values = [age, false, false, true, waitPeriod]
    query(client, sql, values, function (err, results) {
      done()
      if (err) return cb(err)
      cb(null, normalizeTxs(results.rows))
    })
  })
}

function pquery (sql, values) {
  return new Promise((resolve, reject) => {
    connect(function (cerr, client, done) {
      if (cerr) return reject(cerr)
      query(client, sql, values, function (err, results) {
        done(err)
        if (err) return reject(err)
        resolve(results)
      })
    })
  })
}

exports.updateTxStatus = function updateTxStatus (tx, status, confirm) {
  var sql = confirm
  ? 'UPDATE transactions SET status=$1, confirmation_time=now() WHERE id=$2'
  : 'UPDATE transactions SET status=$1 WHERE id=$2'

  var values = [status, tx.id]

  return pquery(sql, values)
}

exports.updateRedeem = function updateRedeem (session, cb) {
  var sql = 'UPDATE transactions SET redeem=$1 ' +
  'WHERE device_fingerprint=$2 AND session_id=$3'

  return new Promise((resolve, reject) => {
    connect(function (cerr, client, done) {
      if (cerr) return reject(cerr)
      var values = [true, session.fingerprint, session.id]
      query(client, sql, values, function (err) {
        done(err)
        if (err) return reject(err)
        resolve()
      })
    })
  })
}

exports.updateNotify = function updateNotify (tx) {
  var sql = 'UPDATE transactions SET notified=$1 ' +
  'WHERE id=$2'

  return new Promise((resolve, reject) => {
    connect(function (cerr, client, done) {
      if (cerr) return reject(cerr)
      var values = [true, tx.id]
      query(client, sql, values, function (err) {
        done(err)
        if (err) return reject(err)
        resolve()
      })
    })
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
  return pquery(sql, [session.fingerprint, session.id, path, method, body])
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
    return pquery(sql, values)
    .then(r => ({body: r.rows[0].body}))
  })
}

function pruneCachedResponses () {
  const sql = `delete from cached_responses
  where (EXTRACT(EPOCH FROM (now() - created))) * 1000 < $1`

  const values = [CACHED_SESSION_TTL]

  return pquery(sql, values)
}

exports.cacheResponse = function (session, path, method, body) {
  const sql = `update cached_responses
  set body=$1
  where device_fingerprint=$2
  and session_id=$3
  and path=$4
  and method=$5`

  const values = [body, session.fingerprint, session.id, path, method]

  return pquery(sql, values)
}

/*
exports.init('postgres://lamassu:lamassu@localhost/lamassu')
connect(function(err, client, done) {
  var sql = 'select * from transactions where id=$1'
  query(client, sql, [130], function(_err, results) {
    done()
    console.dir(results.rows[0])
  })
})
*/
