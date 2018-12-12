const _ = require('lodash/fp')
const pgp = require('pg-promise')()
const pEachSeries = require('p-each-series')

const db = require('../db')
const plugins = require('../plugins')
const logger = require('../logger')

const cashInAtomic = require('./cash-in-atomic')
const cashInLow = require('./cash-in-low')

const PENDING_INTERVAL = '60 minutes'
const MAX_PENDING = 10

module.exports = {post, monitorPending, cancel, PENDING_INTERVAL}

function post (machineTx, pi) {
  return db.tx(cashInAtomic.atomic(machineTx, pi))
    .then(r => {
      const updatedTx = r.tx

      return postProcess(r, pi)
        .then(changes => cashInLow.update(db, updatedTx, changes))
        .then(tx => _.set('bills', machineTx.bills, tx))
    })
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

function postProcess (r, pi) {
  registerTrades(pi, r.newBills)

  if (!cashInLow.isClearToSend(r.dbTx, r.tx)) return Promise.resolve({})

  return pi.sendCoins(r.tx)
    .then(txObj => ({
      txHash: txObj.txid,
      fee: txObj.fee,
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
    .then(sendRec => {
      pi.notifyOperator(r.tx, sendRec)
        .catch((err) => logger.error('Failure sending transaction notification', err))
      return logAction(sendRec, r.tx)
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
    const tx = cashInLow.toObj(row)
    const pi = plugins(settings, tx.deviceId)

    return post(tx, pi)
      .catch(logger.error)
  }

  return db.any(sql, [PENDING_INTERVAL, MAX_PENDING])
    .then(rows => pEachSeries(rows, row => processPending(row)))
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
