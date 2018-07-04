const _ = require('lodash/fp')

const db = require('../db')
const machineLoader = require('../machine-loader')
const tx = require('../tx')
const cashInTx = require('../cash-in/cash-in-tx')

const NUM_RESULTS = 1000

function addNames (txs) {
  return machineLoader.getMachineNames()
    .then(machines => {
      const addName = tx => {
        const machine = _.find(['deviceId', tx.deviceId], machines)
        const name = machine ? machine.name : 'Unpaired'
        return _.set('machineName', name, tx)
      }

      return _.map(addName, txs)
    })
}

const camelize = _.mapKeys(_.camelCase)

function batch () {
  const packager = _.flow(_.flatten, _.orderBy(_.property('created'), ['desc']),
    _.take(NUM_RESULTS), _.map(camelize), addNames)

  const cashInSql = `select 'cashIn' as tx_class, cash_in_txs.*,
  ((not send_confirmed) and (created <= now() - interval $1)) as expired
  from cash_in_txs
  order by created desc limit $2`

  const cashOutSql = `select 'cashOut' as tx_class, cash_out_txs.*
  from cash_out_txs
  order by created desc limit $1`

  return Promise.all([db.any(cashInSql, [cashInTx.PENDING_INTERVAL, NUM_RESULTS]), db.any(cashOutSql, [NUM_RESULTS])])
    .then(packager)
}

function single (txId) {
  const packager = _.flow(_.compact, _.map(camelize), addNames)

  const cashInSql = `select 'cashIn' as tx_class,
  ((not send_confirmed) and (created <= now() - interval $1)) as expired,
  cash_in_txs.*
  from cash_in_txs
  where id=$2`

  const cashOutSql = `select 'cashOut' as tx_class, cash_out_txs.*
  from cash_out_txs
  where id=$1`

  return Promise.all([
    db.oneOrNone(cashInSql, [cashInTx.PENDING_INTERVAL, txId]),
    db.oneOrNone(cashOutSql, [txId])
  ])
    .then(packager)
    .then(_.head)
}

function cancel (txId) {
  return tx.cancel(txId)
    .then(() => single(txId))
}

module.exports = {batch, single, cancel}
