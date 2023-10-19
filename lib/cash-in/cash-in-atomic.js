const _ = require('lodash/fp')
const pgp = require('pg-promise')()

const db = require('../db')
const E = require('../error')

const cashInLow = require('./cash-in-low')

module.exports = { atomic }

function atomic (machineTx, pi) {
  const TransactionMode = pgp.txMode.TransactionMode
  const isolationLevel = pgp.txMode.isolationLevel
  const mode = new TransactionMode({ tiLevel: isolationLevel.serializable })
  function transaction (t) {
    const sql = 'select * from cash_in_txs where id=$1'
    const sql2 = 'select * from bills where cash_in_txs_id=$1'

    return t.oneOrNone(sql, [machineTx.id])
      .then(row => {
        if (row && row.tx_version >= machineTx.txVersion) throw new E.StaleTxError({ txId: machineTx.id })

        return t.any(sql2, [machineTx.id])
          .then(billRows => {
            const dbTx = cashInLow.toObj(row)

            return preProcess(dbTx, machineTx, pi)
              .then(preProcessedTx => cashInLow.upsert(t, dbTx, preProcessedTx))
              .then(r => {
                return insertNewBills(t, billRows, machineTx)
                  .then(newBills => _.set('newBills', newBills, r))
              })
          })
      })
  }
  return db.tx({ mode }, transaction)
}

function insertNewBills (t, billRows, machineTx) {
  const bills = pullNewBills(billRows, machineTx)
  if (_.isEmpty(bills)) return Promise.resolve([])

  const _dbBills = _.map(cashInLow.massage, bills)
  // BACKWARDS_COMPATIBILITY 8.1
  // bills before 8.6 don't have destination_unit
  const dbBills = _.map(_.defaults({ destination_unit: 'cashbox'}))(_dbBills)

  const billsByDestination = _.countBy(_.get(['destination_unit']) ,dbBills)

  const columns = ['id', 'fiat', 'fiat_code', 'crypto_code', 'cash_in_fee', 'cash_in_txs_id', 'device_time', 'destination_unit']
  const sql = pgp.helpers.insert(dbBills, columns, 'bills')
  const deviceID = machineTx.deviceId
  const sql2 = `update devices set recycler1 = recycler1 + $2, recycler2 = recycler2 + $3, recycler3 = recycler3 + $4, recycler4 = recycler4 + $5, recycler5 = recycler5 + $6, recycler6 = recycler6 + $7
  where device_id = $1`

  return t.none(sql2, [
    deviceID,
    _.defaultTo(0, billsByDestination.recycler1),
    _.defaultTo(0, billsByDestination.recycler2),
    _.defaultTo(0, billsByDestination.recycler3),
    _.defaultTo(0, billsByDestination.recycler4),
    _.defaultTo(0, billsByDestination.recycler5),
    _.defaultTo(0, billsByDestination.recycler6)
  ])
    .then(() => {
      return t.none(sql)
    })
    .then(() => bills)
}

function pullNewBills (billRows, machineTx) {
  if (_.isEmpty(machineTx.bills)) return []

  const toBill = _.mapKeys(_.camelCase)
  const bills = _.map(toBill, billRows)

  return _.differenceBy(_.get('id'), machineTx.bills, bills)
}

function preProcess (dbTx, machineTx, pi) {
  // Note: The way this works is if we're clear to send,
  // we mark the transaction as sendPending.
  //
  // If another process is trying to also mark this as sendPending
  // that means that it saw the tx as sendPending=false.
  // But if that's true, then it must be serialized before this
  // (otherwise it would see sendPending=true), and therefore we can't
  // be seeing sendPending=false (a pre-condition of clearToSend()).
  // Therefore, one of the conflicting transactions will error,
  // which is what we want.
  return new Promise(resolve => {
    if (!dbTx) return resolve(machineTx)

    if (cashInLow.isClearToSend(dbTx, machineTx)) {
      return resolve(_.set('sendPending', true, machineTx))
    }

    return resolve(machineTx)
  })
}
