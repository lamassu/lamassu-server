const _ = require('lodash/fp')
const pgp = require('pg-promise')()
const pEachSeries = require('p-each-series')

const db = require('../db')
const dbErrorCodes = require('../db-error-codes')
const billMath = require('../bill-math')
const T = require('../time')
const logger = require('../logger')
const plugins = require('../plugins')

const httpError = require('../route-helpers').httpError
const helper = require('./cash-out-helper')
const cashOutAtomic = require('./cash-out-atomic')
const cashOutActions = require('./cash-out-actions')
const cashOutLow = require('./cash-out-low')

module.exports = {
  post,
  monitorLiveIncoming,
  monitorStaleIncoming,
  monitorUnnotified,
  cancel
}

const STALE_INCOMING_TX_AGE = T.day
const STALE_LIVE_INCOMING_TX_AGE = 10 * T.minutes
const MAX_NOTIFY_AGE = T.day
const MIN_NOTIFY_AGE = 5 * T.minutes
const INSUFFICIENT_FUNDS_CODE = 570

const toObj = helper.toObj

function selfPost (tx, pi) {
  return post(tx, pi, false)
}

function post (tx, pi, fromClient = true) {
  logger.silly('Updating cashout -- tx:', JSON.stringify(tx))
  logger.silly('Updating cashout -- fromClient:', JSON.stringify(fromClient))
  return cashOutAtomic.atomic(tx, pi, fromClient)
    .then(txVector => {
      const [, newTx, justAuthorized] = txVector
      return postProcess(txVector, justAuthorized, pi)
        .then(changes => cashOutLow.update(db, newTx, changes))
    })
}

function postProcess (txVector, justAuthorized, pi) {
  const [oldTx, newTx] = txVector

  if (justAuthorized) {
    pi.sell(newTx)
    pi.notifyOperator(newTx, { isRedemption: false })
      .catch((err) => logger.error('Failure sending transaction notification', err))
  }

  if ((newTx.dispense && !oldTx.dispense) || (newTx.redeem && !oldTx.redeem)) {
    return pi.buildAvailableUnits(newTx.id)
      .then(units => {
        units = _.concat(units.cassettes, units.recyclers)
        logger.silly('Computing bills to dispense:', {
          txId: newTx.id,
          units: units,
          fiat: newTx.fiat
        })
        const bills = billMath.makeChange(units, newTx.fiat)
        logger.silly('Bills to dispense:', JSON.stringify(bills))

        if (!bills) throw httpError('Out of bills', INSUFFICIENT_FUNDS_CODE)
        return bills
      })
      .then(bills => {
        const rec = {}

        _.forEach(it => {
          const suffix = _.snakeCase(bills[it].name.replace(/cassette/gi, ''))
          rec[`provisioned_${suffix}`] = bills[it].provisioned
          rec[`denomination_${suffix}`] = bills[it].denomination
        }, _.times(_.identity(), _.size(bills)))

        return cashOutActions.logAction(db, 'provisionNotes', rec, newTx)
          .then(_.constant({ bills }))
      })
      .catch(err => {
        pi.notifyOperator(newTx, { error: err.message, isRedemption: true })
          .catch((err) => logger.error('Failure sending transaction notification', err))
        return cashOutActions.logError(db, 'provisionNotesError', err, newTx)
          .then(() => { throw err })
      })
  }

  return Promise.resolve({})
}

function fetchOpenTxs (statuses, fromAge, toAge) {
  const sql = `select *
  from cash_out_txs
  where ((extract(epoch from (now() - created))) * 1000)>$1
  and ((extract(epoch from (now() - created))) * 1000)<$2
  and status in ($3^)
  and error is distinct from 'Operator cancel'`

  const statusClause = _.map(pgp.as.text, statuses).join(',')

  return db.any(sql, [fromAge, toAge, statusClause])
    .then(rows => rows.map(toObj))
}

function processTxStatus (tx, settings) {
  const pi = plugins(settings, tx.deviceId)

  return pi.getStatus(tx)
    .then(res => _.assign(tx, { receivedCryptoAtoms: res.receivedCryptoAtoms, status: res.status }))
    .then(_tx => getWalletScore(_tx, pi))
    .then(_tx => selfPost(_tx, pi))
}

function getWalletScore (tx, pi) {
  const statuses = ['published', 'authorized', 'confirmed', 'insufficientFunds']

  if (!_.includes(tx.status, statuses) || !_.isNil(tx.walletScore)) {
    return tx
  }

  // Transaction shows up on the blockchain, we can request the sender address
  return pi.isWalletScoringEnabled(tx)
    .then(isEnabled => {
      if (!isEnabled) return tx
      return pi.rateTransaction(tx)
        .then(res =>
          res.isValid
            ? _.assign(tx, { walletScore: res.score })
            : _.assign(tx, {
              walletScore: res.score,
              error: 'Chain analysis score is above defined threshold',
              errorCode: 'scoreThresholdReached',
              dispense: true
            })
        )
        .catch(error => _.assign(tx, {
          walletScore: 10,
          error: `Failure getting address score: ${error.message}`,
          errorCode: 'walletScoringError',
          dispense: true
        }))
    })
}

function monitorLiveIncoming (settings) {
  const statuses = ['notSeen', 'published', 'insufficientFunds']
  return monitorIncoming(settings, statuses, 0, STALE_LIVE_INCOMING_TX_AGE)
}

function monitorStaleIncoming (settings) {
  const statuses = ['notSeen', 'published', 'authorized', 'instant', 'rejected', 'insufficientFunds']
  return monitorIncoming(settings, statuses, STALE_LIVE_INCOMING_TX_AGE, STALE_INCOMING_TX_AGE)
}

function monitorIncoming (settings, statuses, fromAge, toAge) {
  return fetchOpenTxs(statuses, fromAge, toAge)
    .then(txs => pEachSeries(txs, tx => processTxStatus(tx, settings)))
    .catch(err => {
      if (err.code === dbErrorCodes.SERIALIZATION_FAILURE) {
        logger.warn('Harmless DB conflict, the query will be retried.')
      } else {
        logger.error(err)
      }
    })
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
    .then(() => cashOutActions.logActionById(db, 'operatorCompleted', {}, txId))
}
