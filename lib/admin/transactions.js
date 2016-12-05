const _ = require('lodash/fp')

const db = require('../db')

const NUM_RESULTS = 20

function batch () {
  const camelize = _.mapKeys(_.camelCase)
  const packager = _.flow(_.flatten, _.orderBy(_.property('created'), ['desc']), _.take(NUM_RESULTS), _.map(camelize))

  const cashInSql = `select 'cashIn' as tx_class, devices.name as machine_name, cash_in_txs.*
  from cash_in_txs, devices
  where devices.device_id=cash_in_txs.device_id
  order by created desc limit $1`

  const cashOutSql = `select 'cashOut' as tx_class, devices.name as machine_name, cash_out_txs.*
  from cash_out_txs, devices
  where devices.device_id=cash_out_txs.device_id
  order by created desc limit $1`

  return Promise.all([db.any(cashInSql, [NUM_RESULTS]), db.any(cashOutSql, [NUM_RESULTS])])
  .then(packager)
}

module.exports = {batch}
