const _ = require('lodash/fp')
const pgp = require('pg-promise')()
const pEachSeries = require('p-each-series')

const blacklist = require('../blacklist')
const db = require('../db')
const plugins = require('../plugins')
const logger = require('../logger')
const settingsLoader = require('../new-settings-loader')
const configManager = require('../new-config-manager')
const notifier = require('../notifier')

const cashInAtomic = require('./cash-in-atomic')
const cashInLow = require('./cash-in-low')

const PENDING_INTERVAL = '60 minutes'
const MAX_PENDING = 10

const TRANSACTION_STATES = `
case
  when operator_completed and error = 'Operator cancel' then 'Cancelled'
  when error is not null then 'Error'
  when send_confirmed then 'Sent'
  when ((not send_confirmed) and (created <= now() - interval '${PENDING_INTERVAL}')) then 'Expired'
  else 'Pending'
end`

module.exports = {post, monitorPending, cancel, PENDING_INTERVAL, TRANSACTION_STATES}

function post (machineTx, pi) {
  logger.silly('Updating cashin tx:', machineTx)
  return cashInAtomic.atomic(machineTx, pi)
    .then(r => {
      const updatedTx = r.tx
      let blacklisted = false
      let addressReuse = false
      let walletScore = {}

      return Promise.all([settingsLoader.loadLatest(), checkForBlacklisted(updatedTx), doesTxReuseAddress(updatedTx), getWalletScore(updatedTx, pi)])
        .then(([{ config }, blacklistItems, isReusedAddress, fetchedWalletScore]) => {
          const rejectAddressReuse = configManager.getCompliance(config).rejectAddressReuse

          walletScore = fetchedWalletScore

          if (_.some(it => it.address === updatedTx.toAddress)(blacklistItems)) {
            blacklisted = true
            notifier.notifyIfActive('compliance', 'blacklistNotify', r.tx, false)
          } else if (isReusedAddress && rejectAddressReuse) {
            notifier.notifyIfActive('compliance', 'blacklistNotify', r.tx, true)
            addressReuse = true
          }
          return postProcess(r, pi, blacklisted, addressReuse, walletScore)
        })
        .then(changes => cashInLow.update(db, updatedTx, changes))
        .then(tx => _.set('bills', machineTx.bills, tx))
        .then(tx => _.set('blacklisted', blacklisted, tx))
        .then(tx => _.set('addressReuse', addressReuse, tx))
        .then(tx => _.set('validWalletScore', _.isNil(walletScore) ? true : walletScore.isValid, tx))
        .then(tx => _.set('walletScore', _.isNil(walletScore) ? null : walletScore.score, tx))
    })
}

function registerTrades (pi, r) {
  _.forEach(bill => pi.buy(bill, r.tx), r.newBills)
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
  const rec = _.assign(_rec, { action, tx_id: txId })
  const sql = pgp.helpers.insert(rec, null, 'cash_in_actions')

  return db.none(sql)
}

function checkForBlacklisted (tx) {
  // Check only on addressScan and avoid testing for blacklist on every bill inserted
  if (!tx.fiat || tx.fiat.isZero()) {
    return blacklist.blocked(tx.toAddress, tx.cryptoCode)
  }
  return Promise.resolve(false)
}

function postProcess (r, pi, isBlacklisted, addressReuse, walletScore) {
  if (addressReuse) {
    return Promise.resolve({
      operatorCompleted: true,
      error: 'Address Reused'
    })
  }

  if (isBlacklisted) {
    return Promise.resolve({
      operatorCompleted: true,
      error: 'Blacklisted Address'
    })
  }

  if (!_.isNil(walletScore) && !walletScore.isValid) {
    return Promise.resolve({
      walletScore: walletScore.score,
      operatorCompleted: true,
      error: 'Ciphertrace score is above defined threshold'
    })
  }

  registerTrades(pi, r)

  if (!cashInLow.isClearToSend(r.dbTx, r.tx)) return Promise.resolve({})

  return pi.sendCoins(r.tx)
    .then(txObj => {
      if (txObj.batched) {
        return {
          batched: true,
          batchTime: 'now()^',
          sendPending: true,
          error: null,
          errorCode: null
        }
      }

      return {
        txHash: txObj.txid,
        fee: txObj.fee,
        sendConfirmed: true,
        sendTime: 'now()^',
        sendPending: false,
        error: null,
        errorCode: null
      }
    })
    .catch(err => {
      // Important: We don't know what kind of error this is
      // so not safe to assume that funds weren't sent.

      // Setting sendPending to true ensures that the transaction gets
      // silently terminated and no retries are done

      return {
        sendTime: 'now()^',
        error: err.message,
        errorCode: err.name,
        sendPending: true
      }
    })
    .then(sendRec => {
      pi.notifyOperator(r.tx, sendRec)
        .catch((err) => logger.error('Failure sending transaction notification', err))
      return logAction(sendRec, r.tx)
    })
}

function doesTxReuseAddress (tx) {
  if (!tx.fiat || tx.fiat.isZero()) {
    const sql = `SELECT EXISTS (SELECT DISTINCT to_address FROM cash_in_txs WHERE to_address = $1)`
    return db.any(sql, [tx.toAddress])
  }
  return Promise.resolve(false)
}

function getWalletScore (tx, pi) {
  if (!tx.fiat || tx.fiat.isZero()) {
    return pi.rateWallet(tx.cryptoCode, tx.toAddress)
  }
  // Passthrough the previous result
  return pi.isValidWalletScore(tx.walletScore)
    .then(isValid => ({
      address: tx.toAddress,
      score: tx.walletScore,
      isValid
    }))
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
