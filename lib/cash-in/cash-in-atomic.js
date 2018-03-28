const _ = require('lodash/fp')
const pgp = require('pg-promise')()

const E = require('../error')

const cashInLow = require('./cash-in-low')

module.exports = {atomic}

function atomic (machineTx, pi) {
  const TransactionMode = pgp.txMode.TransactionMode
  const isolationLevel = pgp.txMode.isolationLevel
  const tmSRD = new TransactionMode({tiLevel: isolationLevel.serializable})

  function transaction (t) {
    const sql = 'select * from cash_in_txs where id=$1'
    const sql2 = 'select * from bills where cash_in_txs_id=$1'

    return t.oneOrNone(sql, [machineTx.id])
      .then(row => {
        if (row && row.tx_version >= machineTx.txVersion) throw new E.StaleTxError('Stale tx')

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

  transaction.txMode = tmSRD

  return transaction
}

function insertNewBills (t, billRows, machineTx) {
  const bills = pullNewBills(billRows, machineTx)
  if (_.isEmpty(bills)) return Promise.resolve([])

  const dbBills = _.map(cashInLow.massage, bills)
  const columns = _.keys(dbBills[0])
  const sql = pgp.helpers.insert(dbBills, columns, 'bills')

  return t.none(sql)
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
