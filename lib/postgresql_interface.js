'use strict'

// TODO: Consider using serializable transactions for true ACID

var BigNumber = require('bignumber.js')
var pg = require('pg')
var async = require('async')
var _ = require('lodash')

var logger = require('./logger')

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

function rollback (client, done) {
  client.query('ROLLBACK', function (err) {
    return done(err)
  })
}

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
    rec.cryptoAtoms,
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

function silentQuery (client, queryStr, values, cb) {
  if (!cb) {
    cb = values
    values = []
  }

  client.query(queryStr, values, function (err) {
    if (err) {
      if (!isLowSeverity(err)) {
        console.error(err)
        console.log(queryStr)
        console.log(values)
      }
      cb(err)
    }
    cb()
  })
}

// OPTIMIZE: No need to query bills if tx.fiat and tx.cryptoAtoms are set
function billsAndTxs (client, session, cb) {
  var sessionId = session.id
  var fingerprint = session.fingerprint
  var billsQuery = 'SELECT COALESCE(SUM(denomination), 0) as fiat, ' +
    'COALESCE(SUM(satoshis), 0) AS satoshis ' +
    'FROM bills ' +
    'WHERE device_fingerprint=$1 AND session_id=$2'
  var billsValues = [fingerprint, sessionId]
  var txQuery = 'SELECT COALESCE(SUM(fiat), 0) AS fiat, ' +
    'COALESCE(SUM(satoshis), 0) AS satoshis ' +
    'FROM transactions ' +
    'WHERE device_fingerprint=$1 AND session_id=$2 AND stage=$3'
  var txValues = [fingerprint, sessionId, 'partial_request']

  async.parallel([
    async.apply(query, client, billsQuery, billsValues),
    async.apply(query, client, txQuery, txValues)
  ], function (err, results) {
    if (err) return cb(err)

    // Note: PG SUM function returns int8, which is returned as a string, so
    // we need to parse, since we know these won't be huge numbers.
    cb(null, {
      billsFiat: parseInt(results[0].rows[0].fiat, 10),
      billsCryptoAtoms: new BigNumber(results[0].rows[0].satoshis),
      txFiat: parseInt(results[1].rows[0].fiat, 10),
      txCryptoAtoms: new BigNumber(results[1].rows[0].satoshis)
    })
  })
}

function computeSendAmount (tx, totals) {
  var fiatRemaining = (tx.fiat || totals.billsFiat) - totals.txFiat

  var cryptoAtomsRemaining = tx.cryptoAtoms.eq(0)
    ? totals.billsCryptoAtoms.minus(totals.txCryptoAtoms)
    : tx.cryptoAtoms.minus(totals.txCryptoAtoms)

  var result = {
    fiat: fiatRemaining,
    cryptoAtoms: cryptoAtomsRemaining
  }
  if (result.fiat < 0 || result.cryptoAtoms.lt(0)) {
    logger.warn({tx: tx, totals: totals, result: result},
      "computeSendAmount result < 0, this shouldn't happen. " +
      'Maybe timeout arrived after machineSend.')
    result.fiat = 0
    result.cryptoAtoms = new BigNumber(0)
  }
  return result
}

exports.removeOldPending = function removeOldPending (timeoutMS) {
  connect(function (cerr, client, done) {
    if (cerr) return
    var sql = 'DELETE FROM pending_transactions ' +
      'WHERE incoming AND extract(EPOCH FROM now() - updated) > $1'
    var timeoutS = timeoutMS / 1000
    var values = [timeoutS]
    query(client, sql, values, function (err) {
      done()
      if (err) logger.error(err)
    })
  })
}

exports.pendingTxs = function pendingTxs (timeoutMS, cb) {
  connect(function (cerr, client, done) {
    if (cerr) return cb(cerr)
    var sql = 'SELECT * ' +
      'FROM pending_transactions ' +
      'WHERE (incoming OR extract(EPOCH FROM now() - updated) > $1) ' +
      'ORDER BY updated ASC'
    var timeoutS = timeoutMS / 1000
    var values = [timeoutS]
    query(client, sql, values, function (err, results) {
      done()
      cb(err, normalizeTxs(results))
    })
  })
}

function removePendingTx (client, session, cb) {
  var sql = 'DELETE FROM pending_transactions ' +
    'WHERE device_fingerprint=$1 AND session_id=$2'
  silentQuery(client, sql, [session.fingerprint, session.id], cb)
}

function insertOutgoingTx (client, session, tx, totals, cb) {
  var sendAmount = computeSendAmount(tx, totals)
  var stage = 'partial_request'
  var authority = tx.fiat ? 'machine' : 'timeout'
  var cryptoAtoms = sendAmount.cryptoAtoms
  var fiat = sendAmount.fiat
  if (cryptoAtoms.eq(0)) return cb(null, {cryptoAtoms: new BigNumber(0), fiat: 0})

  insertOutgoing(client, session, tx, cryptoAtoms, fiat, stage, authority,
    function (err) {
      if (err) return cb(err)
      cb(null, {cryptoAtoms: cryptoAtoms, fiat: fiat})
    })
}

function insertOutgoingCompleteTx (client, session, tx, cb) {
  // Only relevant for machine source transactions, not timeouts
  if (!tx.fiat) return cb()

  var stage = 'final_request'
  var authority = 'machine'
  var cryptoAtoms = tx.cryptoAtoms
  var fiat = tx.fiat
  insertOutgoing(client, session, tx, cryptoAtoms, fiat, stage, authority, cb)
}

function insertIncoming (client, session, tx, cryptoAtoms, fiat, stage, authority, cb) {
  var realCryptoAtoms = cryptoAtoms || new BigNumber(0)
  insertTx(client, session, true, tx, realCryptoAtoms, fiat, stage, authority, cb)
}

function insertOutgoing (client, session, tx, cryptoAtoms, fiat, stage, authority,
  cb) {
  insertTx(client, session, false, tx, cryptoAtoms, fiat, stage, authority, cb)
}

function insertTx (client, session, incoming, tx, cryptoAtoms, fiat, stage,
  authority, cb) {
  var fields = [
    'session_id',
    'stage',
    'authority',
    'incoming',
    'device_fingerprint',
    'to_address',
    'satoshis',
    'currency_code',
    'crypto_code',
    'fiat',
    'tx_hash',
    'phone',
    'error'
  ]

  var values = [
    session.id,
    stage,
    authority,
    incoming,
    session.fingerprint,
    tx.toAddress,
    cryptoAtoms,
    tx.currencyCode,
    tx.cryptoCode,
    fiat,
    tx.txHash,
    tx.phone,
    tx.error
  ]

  query(client, getInsertQuery('transactions', fields, true), values,
    function (err, results) {
      if (err) return cb(err)
      cb(null, results.rows[0].id)
    })
}

function refreshPendingTx (client, session, cb) {
  var sql = 'UPDATE pending_transactions SET updated=now() ' +
    'WHERE device_fingerprint=$1 AND session_id=$2'
  connect(function (cerr, client, done) {
    if (cerr) return cb(cerr)
    query(client, sql, [session.fingerprint, session.id], function (err) {
      done(err)
      cb(err)
    })
  })
}

function addPendingTx (client, session, incoming, currencyCode, cryptoCode, toAddress,
  cryptoAtoms, cb) {
  var fields = ['device_fingerprint', 'session_id', 'incoming',
    'currency_code', 'crypto_code', 'to_address', 'satoshis']
  var sql = getInsertQuery('pending_transactions', fields, false)
  var values = [session.fingerprint, session.id, incoming, currencyCode,
    cryptoCode, toAddress, cryptoAtoms.toString()]
  query(client, sql, values, function (err) {
    cb(err)
  })
}

function buildOutgoingTx (client, session, tx, cb) {
  async.waterfall([
    async.apply(billsAndTxs, client, session),
    async.apply(insertOutgoingTx, client, session, tx)
  ], cb)
}

// Calling function should only send bitcoins if result.cryptoAtomsToSend > 0
exports.addOutgoingTx = function addOutgoingTx (session, tx, cb) {
  connect(function (cerr, client, done) {
    if (cerr) return cb(cerr)
    async.series([
      async.apply(silentQuery, client, 'BEGIN'),
      async.apply(silentQuery, client, 'LOCK TABLE transactions'),
      async.apply(insertOutgoingCompleteTx, client, session, tx),
      async.apply(removePendingTx, client, session),
      async.apply(buildOutgoingTx, client, session, tx)
    ], function (err, results) {
      if (err) {
        rollback(client, done)
        return cb(err)
      }
      silentQuery(client, 'COMMIT', [], function () {
        done()
        var toSend = results[4]
        cb(null, toSend)
      })
    })
  })
}

exports.sentCoins = function sentCoins (session, tx, authority, toSend, fee,
  error, txHash) {
  connect(function (cerr, client, done) {
    if (cerr) return logger.error(cerr)

    var newTx = _.clone(tx)
    newTx.txHash = txHash
    newTx.error = error
    insertOutgoing(client, session, newTx, toSend.cryptoAtoms, toSend.fiat,
      'partial_send', authority, function (err) {
        done()
        if (err) logger.error(err)
      })
  })
}

function ensureNotFinal (client, session, cb) {
  var sql = 'SELECT id FROM transactions ' +
    'WHERE device_fingerprint=$1 AND session_id=$2 AND incoming=$3 ' +
    'AND stage=$4' +
    'LIMIT 1'
  var values = [session.fingerprint, session.id, false, 'final_request']

  client.query(sql, values, function (err, results) {
    var error
    if (err) return cb(err)
    if (results.rows.length > 0) {
      error = new Error('Final request already exists')
      error.name = 'staleBill'
      error.severity = 'low'
      return cb(error)
    }
    cb()
  })
}

exports.addOutgoingPending = function addOutgoingPending (session, currencyCode,
  cryptoCode, toAddress, cb) {
  connect(function (cerr, client, done) {
    if (cerr) return cb(cerr)

    async.series([
      async.apply(silentQuery, client, 'BEGIN', null),
      async.apply(ensureNotFinal, client, session),
      async.apply(addPendingTx, client, session, false, currencyCode, cryptoCode, toAddress,
        0)
    ], function (err) {
      if (err) {
        return rollback(client, function (rberr) {
          done(rberr)

          if (isUniqueViolation(err)) {
            // Pending tx exists, refresh it.
            return refreshPendingTx(client, session, cb)
          }
          if (err.name === 'staleBill') {
            logger.info('Received a bill insert after send coins request')
            return cb()
          }
          logger.error(err)
          return cb(err)
        })
      }
      silentQuery(client, 'COMMIT', null, function () {
        done()
        cb()
      })
    })
  })
}

exports.addInitialIncoming = function addInitialIncoming (session, tx, cb) {
  connect(function (cerr, client, done) {
    if (cerr) return cb(cerr)
    async.series([
      async.apply(silentQuery, client, 'BEGIN', null),
      async.apply(addPendingTx, client, session, true, tx.currencyCode,
        tx.cryptoCode, tx.toAddress, tx.cryptoAtoms),
      async.apply(insertIncoming, client, session, tx, tx.cryptoAtoms, tx.fiat,
        'initial_request', 'pending')
    ], function (err) {
      if (err) {
        rollback(client, done)
        return cb(err)
      }
      silentQuery(client, 'COMMIT', null, function () {
        done()
        cb()
      })
    })
  })
}

function insertDispense (client, session, tx, cartridges, transactionId, cb) {
  var fields = [
    'device_fingerprint', 'transaction_id',
    'dispense1', 'reject1', 'count1',
    'dispense2', 'reject2', 'count2',
    'refill', 'error'
  ]

  var sql = getInsertQuery('dispenses', fields, true)

  var dispense1 = tx.bills[0].actualDispense
  var dispense2 = tx.bills[1].actualDispense
  var reject1 = tx.bills[0].rejected
  var reject2 = tx.bills[1].rejected
  var count1 = cartridges[0].count
  var count2 = cartridges[1].count
  var values = [
    session.fingerprint, transactionId,
    dispense1, reject1, count1, dispense2, reject2, count2,
    false, tx.error
  ]
  client.query(sql, values, cb)
}

exports.addIncomingPhone = function addIncomingPhone (session, tx, cb) {
  var sql = 'UPDATE transactions SET phone=$1 ' +
    'WHERE incoming=$2 AND device_fingerprint=$3 AND session_id=$4'
  connect(function (cerr, client, done) {
    if (cerr) return cb(cerr)
    var values = [tx.phone, true, session.fingerprint, session.id]
    query(client, sql, values, function (err) {
      done(err)
      cb(err)
    })
  })
}

function normalizeTxs (txs) {
  return txs.map(function (tx) {
    tx.toAddress = tx.to_address
    tx.currencyCode = tx.currency_code
    tx.txHash = tx.tx_hash
    tx.cryptoCode = tx.crypto_code
    tx.cryptoAtoms = new BigNumber(tx.satoshis)

    tx.to_address = undefined
    tx.currency_code = undefined
    tx.tx_hash = undefined
    tx.crypto_code = undefined
    tx.satoshis = undefined

    return tx
  })
}

exports.fetchPhoneTxs = function fetchPhoneTxs (phone, dispenseTimeout, cb) {
  var sql = 'SELECT * FROM transactions ' +
    'WHERE phone=$1 AND dispensed=$2 ' +
    'AND (EXTRACT(EPOCH FROM (now() - created))) * 1000 < $1'

  connect(function (cerr, client, done) {
    if (cerr) return cb(cerr)
    query(client, sql, [phone, false, dispenseTimeout], function (err, results) {
      done()
      if (err) return cb(err)
      cb(null, normalizeTxs(results.rows))
    })
  })
}

exports.fetchTx = function fetchTx (session, cb) {
  var sql = 'SELECT * FROM transactions ' +
    'WHERE device_fingerprint=$1 AND session_id=$2 ' +
    'ORDER BY created'

  connect(function (cerr, client, done) {
    if (cerr) return cb(cerr)
    query(client, sql, [session.fingerprint, session.id], function (err, results) {
      done()
      if (err) return cb(err)
      cb(null, normalizeTxs(results.rows))
    })
  })
}

exports.addDispenseRequest = function addDispenseRequest (session, tx, cb) {
  connect(function (cerr, client, done) {
    if (cerr) return

    const originalSession = {id: tx.sessionId, fingerprint: session.fingerprint}
    async.waterfall([
      async.apply(updateDispense, client, true),
      async.apply(insertIncoming, client, originalSession, tx, 0, tx.fiat,
        'dispense', 'pending')
    ], function (err) {
      done()
      if (err) logger.error(err)
    })
  })
}

function updateDispense (client, session, dispensed, cb) {
  var sql = 'UPDATE transactions SET dispense=$1 ' +
    'WHERE stage=$2 AND authority=$3 AND device_fingerprint=$4 AND session_id=$5'
  var values = [dispensed, 'initial_request', 'deposit', session.fingerprint, session.id]
  query(client, sql, values, function (err) {
    cb(err)
  })
}

exports.addDispense = function addDispense (session, tx, cartridges) {
  connect(function (cerr, client, done) {
    if (cerr) return

    async.waterfall([
      async.apply(insertIncoming, client, session, tx, 0, tx.fiat,
        'dispense', 'authorized'),
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

exports.fetchOpenTxs = function fetchOpenTxs (statuses, age, cb) {
  var sql = 'SELECT *, (EXTRACT(EPOCH FROM (now() - created))) * 1000 AS age ' +
  'FROM transactions ' +
  'WHERE incoming=$1 age<$2 AND status IN $3'

  connect(function (cerr, client, done) {
    if (cerr) return cb(cerr)

    query(client, sql, [true, age, statuses], function (err, results) {
      done()
      if (err) return cb(err)
      cb(null, normalizeTxs(results))
    })
  })
}

exports.updateTxStatus = function updateTxStatus (tx, status, cb) {
  var sql = 'UPDATE transactions SET status=$1 WHERE id=$2'

  connect(function (cerr, client, done) {
    if (cerr) return cb(cerr)
    var values = [status, tx.id]
    query(client, sql, values, function (err) {
      done(err)
      cb(err)
    })
  })
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
