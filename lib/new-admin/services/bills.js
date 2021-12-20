const _ = require('lodash/fp')

const db = require('../../db')

// Get all bills with device id
const getBills = () => {
  const sql = `SELECT b.id, b.fiat, b.fiat_code, b.created, b.cashbox_batch_id, cit.device_id AS device_id FROM bills b LEFT OUTER JOIN (
    SELECT id, device_id FROM cash_in_txs
  ) AS cit ON cit.id = b.cash_in_txs_id`

  return db.any(sql)
    .then(res => _.map(_.mapKeys(_.camelCase), res))
}

function getLooseBills () {
  const sql = `SELECT b.id, b.fiat, b.fiat_code, b.created, b.cashbox_batch_id, cit.device_id AS device_id FROM bills b LEFT OUTER JOIN (
    SELECT id, device_id FROM cash_in_txs
  ) AS cit ON cit.id = b.cash_in_txs_id WHERE b.cashbox_batch_id IS NULL`

  return db.any(sql)
    .then(res => _.map(_.mapKeys(_.camelCase), res))
}

function getLooseBillsByMachine (machineId) {
  const sql = `SELECT b.id, b.fiat, b.fiat_code, b.created, b.cashbox_batch_id, cit.device_id AS device_id FROM bills b LEFT OUTER JOIN (
    SELECT id, device_id FROM cash_in_txs WHERE device_id = $1
  ) AS cit ON cit.id = b.cash_in_txs_id WHERE b.cashbox_batch_id IS NULL`

  return db.any(sql, [machineId])
    .then(res => _.map(_.mapKeys(_.camelCase), res))
}

module.exports = {
  getBills,
  getLooseBills,
  getLooseBillsByMachine
}
