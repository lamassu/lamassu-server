const _ = require('lodash/fp')
const pgp = require('pg-promise')()

const E = require('../error')
const socket = require('../socket-client')
const logger = require('../logger')

const helper = require('./cash-out-helper')
const cashOutActions = require('./cash-out-actions')
const cashOutLow = require('./cash-out-low')

const toObj = helper.toObj

module.exports = {atomic}

function atomic (tx, pi, fromClient) {
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

        return preProcess(t, oldTx, tx, pi)
          .then(preProcessedTx => cashOutLow.upsert(t, oldTx, preProcessedTx))
      })
  }

  transaction.txMode = tmSRD

  return transaction
}

function preProcess (t, oldTx, newTx, pi) {
  if (!oldTx) {
    return pi.isHd(newTx)
      .then(isHd => nextHd(t, isHd, newTx))
      .then(newTxHd => {
        return pi.newAddress(newTxHd)
          .then(_.merge(newTxHd))
      })
      .then(addressedTx => {
        const rec = {
          to_address: addressedTx.toAddress,
          layer_2_address: addressedTx.layer2Address
        }

        return cashOutActions.logAction(t, 'provisionAddress', rec, addressedTx)
      })
      .catch(err => {
        pi.notifyOperator(newTx, { isRedemption: false, error: 'Error while provisioning address' })
          .catch((err) => logger.error('Failure sending transaction notification', err))
        return cashOutActions.logError(t, 'provisionAddress', err, newTx)
          .then(() => { throw err })
      })
  }

  return Promise.resolve(updateStatus(oldTx, newTx))
    .then(updatedTx => {
      if (updatedTx.status !== oldTx.status) {
        const isZeroConf = pi.isZeroConf(updatedTx)
        if (wasJustAuthorized(oldTx, updatedTx, isZeroConf)) {
          pi.sell(updatedTx)
          pi.notifyOperator(updatedTx, { isRedemption: false })
            .catch((err) => logger.error('Failure sending transaction notification', err))
        }

        const rec = {
          to_address: updatedTx.toAddress,
          tx_hash: updatedTx.txHash
        }

        return cashOutActions.logAction(t, updatedTx.status, rec, updatedTx)
      }

      const hasError = !oldTx.error && newTx.error
      const hasDispenseOccurred = !dispenseOccurred(oldTx.bills) && dispenseOccurred(newTx.bills)

      if (hasError || hasDispenseOccurred) {
        return cashOutActions.logDispense(t, updatedTx)
          .then(updateCassettes(t, updatedTx))
          .then((t) => {
            pi.notifyOperator(updatedTx, { isRedemption: true })
              .catch((err) => logger.error('Failure sending transaction notification', err))
            return t
          })
      }

      if (!oldTx.phone && newTx.phone) {
        return cashOutActions.logAction(t, 'addPhone', {}, updatedTx)
      }

      if (!oldTx.redeem && newTx.redeem) {
        return cashOutActions.logAction(t, 'redeemLater', {}, updatedTx)
      }

      return updatedTx
    })
}

function nextHd (t, isHd, tx) {
  if (!isHd) return Promise.resolve(tx)

  return t.one("select nextval('hd_indices_seq') as hd_index")
    .then(row => _.set('hdIndex', row.hd_index, tx))
}

function updateCassettes (t, tx) {
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

  return t.one(sql, values)
    .then(r => socket.emit(_.assign(r, {op: 'cassetteUpdate', deviceId: tx.deviceId})))
}

function wasJustAuthorized (oldTx, newTx, isZeroConf) {
  const isAuthorized = () => _.includes(oldTx.status, ['notSeen', 'published']) &&
    _.includes(newTx.status, ['authorized', 'instant', 'confirmed'])

  const isConfirmed = () => _.includes(oldTx.status, ['notSeen', 'published', 'authorized']) &&
    _.includes(newTx.status, ['instant', 'confirmed'])

  return isZeroConf ? isAuthorized() : isConfirmed()
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

function dispenseOccurred (bills) {
  if (_.isEmpty(bills)) return false
  return _.every(_.overEvery([_.has('dispensed'), _.has('rejected')]), bills)
}
