const constants = require('./constants')
const db = require('./db')
const _ = require('lodash/fp')
const uuid = require('uuid')
const camelize = require('./utils')

function createCashboxBatch (deviceId, cashboxCount) {
  if (_.isEqual(0, cashboxCount)) throw new Error('Cash box is empty. Cash box batch could not be created.')
  const sql = `INSERT INTO cash_unit_operation (id, device_id, created, operation_type) VALUES ($1, $2, now(), 'cash-box-empty')`
  const sql2 = `
    UPDATE bills SET cashbox_batch_id=$1
    FROM cash_in_txs
    WHERE bills.cash_in_txs_id = cash_in_txs.id AND
          cash_in_txs.device_id = $2 AND
          bills.destination_unit = 'cashbox' AND
          bills.cashbox_batch_id IS NULL
  `
  const sql3 = `
    UPDATE empty_unit_bills SET cashbox_batch_id=$1
    WHERE empty_unit_bills.device_id = $2 AND empty_unit_bills.cashbox_batch_id IS NULL`

  return db.tx(t => {
    const batchId = uuid.v4()
    const q1 = t.none(sql, [batchId, deviceId])
    const q2 = t.none(sql2, [batchId, deviceId])
    const q3 = t.none(sql3, [batchId, deviceId])
    return t.batch([q1, q2, q3])
  })
}

function updateMachineWithBatch (machineContext, oldCashboxCount) {
  const cashUnits = machineContext.cashUnits
  const cashUnitNames = ['cashbox', 'cassette1', 'cassette2', 'cassette3', 'cassette4', 'recycler1', 'recycler2', 'recycler3', 'recycler4', 'recycler5', 'recycler6']
  const isValidContext = _.has(['deviceId', 'cashUnits'], machineContext) && _.has(cashUnitNames, cashUnits)
  const cassettes = _.filter(it => !_.isNil(it))([cashUnits.cassette1, cashUnits.cassette2, cashUnits.cassette3, cashUnits.cassette4])
  const isCassetteAmountWithinRange = _.inRange(constants.CASH_OUT_MINIMUM_AMOUNT_OF_CASSETTES, constants.CASH_OUT_MAXIMUM_AMOUNT_OF_CASSETTES + 1, _.size(cassettes))
  if (!isValidContext && !isCassetteAmountWithinRange)
    throw new Error('Insufficient info to create a new cashbox batch')
  if (_.isEqual(0, oldCashboxCount)) throw new Error('Cash box is empty. Cash box batch could not be created.')

  return db.tx(t => {
    const deviceId = machineContext.deviceId
    const batchId = uuid.v4()
    const q1 = t.none(`INSERT INTO cash_unit_operation (id, device_id, created, operation_type) VALUES ($1, $2, now(), 'cash-box-empty')`, [batchId, deviceId])
    const q2 = t.none(`UPDATE bills SET cashbox_batch_id=$1 FROM cash_in_txs
      WHERE bills.cash_in_txs_id = cash_in_txs.id AND
      cash_in_txs.device_id = $2 AND
      bills.destination_unit = 'cashbox' AND
      bills.cashbox_batch_id IS NULL`, [batchId, deviceId])
    const q3 = t.none(`UPDATE empty_unit_bills SET cashbox_batch_id=$1
      WHERE empty_unit_bills.device_id = $2 AND empty_unit_bills.cashbox_batch_id IS NULL`, [batchId, deviceId])
    const q4 = t.none(`
      UPDATE devices SET cassette1=$1, cassette2=$2, cassette3=$3, cassette4=$4,
      recycler1=coalesce($5, recycler1), recycler2=coalesce($6, recycler2), recycler3=coalesce($7, recycler3),
      recycler4=coalesce($8, recycler4), recycler5=coalesce($9, recycler5), recycler6=coalesce($10, recycler6) WHERE device_id=$11
    `, [
      cashUnits.cassette1,
      cashUnits.cassette2,
      cashUnits.cassette3,
      cashUnits.cassette4,
      cashUnits.recycler1,
      cashUnits.recycler2,
      cashUnits.recycler3,
      cashUnits.recycler4,
      cashUnits.recycler5,
      cashUnits.recycler6,
      machineContext.deviceId
    ])

    return t.batch([q1, q2, q3, q4])
  })
}

function getBatches (from = new Date(0).toISOString(), until = new Date().toISOString()) {
  const sql = `
    SELECT 
      cuo.id, 
      cuo.device_id, 
      cuo.created, 
      cuo.operation_type, 
      cuo.bill_count_override, 
      cuo.performed_by,
      COUNT(bi.id) AS bill_count, 
      COALESCE(SUM(bi.fiat), 0) AS fiat_total
    FROM cash_unit_operation AS cuo
    LEFT JOIN (
      SELECT b.id, b.fiat, b.fiat_code, b.created, b.cashbox_batch_id, cit.device_id AS device_id FROM bills b LEFT OUTER JOIN (SELECT id, device_id FROM cash_in_txs) AS cit ON cit.id = b.cash_in_txs_id UNION
      SELECT id, fiat, fiat_code, created, cashbox_batch_id, device_id FROM empty_unit_bills
    ) AS bi ON cuo.id = bi.cashbox_batch_id
    WHERE cuo.created >= $1 AND cuo.created <= $2 AND cuo.operation_type = 'cash-box-empty'
    GROUP BY cuo.id, cuo.device_id, cuo.created, cuo.operation_type, cuo.bill_count_override, cuo.performed_by
    ORDER BY cuo.created DESC
  `

  return db.any(sql, [from, until]).then(camelize)
}

function editBatchById (id, performedBy) {
  const sql = `UPDATE cash_unit_operation SET performed_by=$1 WHERE id=$2 AND cuo.operation_type = 'cash-box-empty'`
  return db.none(sql, [performedBy, id])
}

function getBillsByBatchId (id) {
  const sql = `SELECT bi.* FROM (
    SELECT b.id, b.fiat, b.fiat_code, b.created, b.cashbox_batch_id, cit.device_id AS device_id FROM bills b LEFT OUTER JOIN (SELECT id, device_id FROM cash_in_txs) AS cit ON cit.id = b.cash_in_txs_id UNION
    SELECT id, fiat, fiat_code, created, cashbox_batch_id, device_id FROM empty_unit_bills
  ) AS bi WHERE bi.cashbox_batch_id=$1`
  return db.any(sql, [id])
}

function logFormatter (data) {
  return _.map(
    it => {
      return {
        id: it.id,
        deviceId: it.deviceId,
        created: it.created,
        operationType: it.operationType,
        billCount: it.billCount,
        fiatTotal: it.fiatTotal
      }
    },
    data
  )
}

module.exports = {
  createCashboxBatch,
  updateMachineWithBatch,
  getBatches,
  getBillsByBatchId,
  editBatchById,
  logFormatter
}
