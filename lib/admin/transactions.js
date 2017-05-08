const _ = require('lodash/fp')

const db = require('../db')
const machineLoader = require('../machine-loader')

const NUM_RESULTS = 20

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

function batch () {
  const camelize = _.mapKeys(_.camelCase)
  const packager = _.flow(_.flatten, _.orderBy(_.property('created'), ['desc']),
    _.take(NUM_RESULTS), _.map(camelize), addNames)

  const cashInSql = `select 'cashIn' as tx_class, cash_in_txs.*
  from cash_in_txs
  order by created desc limit $1`

  const cashOutSql = `select 'cashOut' as tx_class, cash_out_txs.*
  from cash_out_txs
  order by created desc limit $1`

  return Promise.all([db.any(cashInSql, [NUM_RESULTS]), db.any(cashOutSql, [NUM_RESULTS])])
  .then(packager)
}

module.exports = {batch}
