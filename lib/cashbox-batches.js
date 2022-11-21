const constants = require('./constants')
const db = require('./db')
const _ = require('lodash/fp')
const uuid = require('uuid')

function createCashboxBatch (deviceId, cashboxCount) {
  if (_.isEqual(0, cashboxCount)) throw new Error('Cash box is empty. Cash box batch could not be created.')
  const sql = `INSERT INTO cashbox_batches (id, device_id, created, operation_type) VALUES ($1, $2, now(), 'cash-box-empty') RETURNING *`
  const sql2 = `
    UPDATE bills SET cashbox_batch_id=$1
    FROM cash_in_txs
    WHERE bills.cash_in_txs_id = cash_in_txs.id AND
          cash_in_txs.device_id = $2 AND 
          bills.cashbox_batch_id IS NULL
  `
  return db.tx(async t => {
    const newBatch = await t.oneOrNone(sql, [uuid.v4(), deviceId])
    return t.oneOrNone(sql2, [newBatch.id, newBatch.device_id])
      .then(() => newBatch)
  })
}

function updateMachineWithBatch (machineContext, oldCashboxCount) {
  const isValidContext = _.has(['deviceId', 'cashbox', 'cassettes'], machineContext)
  const isCassetteAmountWithinRange = _.inRange(constants.CASH_OUT_MINIMUM_AMOUNT_OF_CASSETTES, constants.CASH_OUT_MAXIMUM_AMOUNT_OF_CASSETTES + 1, _.size(machineContext.cassettes))
  if (!isValidContext && !isCassetteAmountWithinRange)
    throw new Error('Insufficient info to create a new cashbox batch')
  if (_.isEqual(0, oldCashboxCount)) throw new Error('Cash box is empty. Cash box batch could not be created.')

  return db.tx(t => {
    const deviceId = machineContext.deviceId
    const batchId = uuid.v4()
    const q1 = t.none(`INSERT INTO cashbox_batches (id, device_id, created, operation_type) VALUES ($1, $2, now(), 'cash-box-empty')`, [batchId, deviceId])
    const q2 = t.none(`UPDATE bills SET cashbox_batch_id=$1 FROM cash_in_txs
      WHERE bills.cash_in_txs_id = cash_in_txs.id AND
      cash_in_txs.device_id = $2 AND 
      bills.cashbox_batch_id IS NULL`, [batchId, deviceId])
    const q3 = t.none(`UPDATE devices SET cashbox=$1, cassette1=$2, cassette2=$3, cassette3=$4, cassette4=$5 WHERE device_id=$6`, [
      machineContext.cashbox,
      machineContext.cassettes[0],
      machineContext.cassettes[1],
      machineContext.cassettes[2],
      machineContext.cassettes[3],
      machineContext.deviceId
    ])

    return t.batch([q1, q2, q3])
  })
}

function getBatches (from = new Date(0).toISOString(), until = new Date().toISOString()) {
  const sql = `
    SELECT cb.id, cb.device_id, cb.created, cb.operation_type, cb.bill_count_override, cb.performed_by, json_agg(b.*) AS bills
    FROM cashbox_batches AS cb
    LEFT JOIN bills AS b ON cb.id = b.cashbox_batch_id
    WHERE cb.created >= $1 AND cb.created <= $2
    GROUP BY cb.id
    ORDER BY cb.created DESC
  `
  return db.any(sql, [from, until]).then(res => _.map(it => _.mapKeys(ite => _.camelCase(ite), it), res))
}

function editBatchById (id, performedBy) {
  const sql = `UPDATE cashbox_batches SET performed_by=$1 WHERE id=$2`
  return db.none(sql, [performedBy, id])
}

function getBillsByBatchId (id) {
  const sql = `SELECT * FROM bills WHERE cashbox_batch_id=$1`
  return db.any(sql, [id])
}

function getMachineUnbatchedBills (deviceId) {
  const sql = `
    SELECT now() AS created, cash_in_txs.device_id, json_agg(b.*) AS bills FROM bills b LEFT OUTER JOIN cash_in_txs
    ON b.cash_in_txs_id = cash_in_txs.id
    WHERE b.cashbox_batch_id IS NULL AND cash_in_txs.device_id = $1
    GROUP BY cash_in_txs.device_id
  `

  return db.oneOrNone(sql, [deviceId])
    .then(res => _.mapKeys(it => _.camelCase(it), res))
    .then(logFormatterSingle)
}

function getBatchById (id) {
  const sql = `
    SELECT cb.id, cb.device_id, cb.created, cb.operation_type, cb.bill_count_override, cb.performed_by, json_agg(b.*) AS bills
    FROM cashbox_batches AS cb
    LEFT JOIN bills AS b ON cb.id = b.cashbox_batch_id
    WHERE cb.id = $1
    GROUP BY cb.id
  `

  return db.oneOrNone(sql, [id]).then(res => _.mapKeys(it => _.camelCase(it), res))
    .then(logFormatterSingle)
}

function logFormatterSingle (data) {
  const bills = _.filter(
    it => !(_.isNil(it) || _.isNil(it.fiat_code) || _.isNil(it.fiat) || _.isNaN(it.fiat)),
    data.bills
  )

  return {
    id: data.id,
    deviceId: data.deviceId,
    created: data.created,
    operationType: data.operationType,
    billCount: _.size(bills),
    fiatTotals: _.reduce(
      (acc, value) => {
        acc[value.fiat_code] = (acc[value.fiat_code] || 0) + value.fiat
        return acc
      },
      {},
      bills
    ),
    billsByDenomination: _.countBy(it => `${it.fiat} ${it.fiat_code}`, bills)
  }
}

function logFormatter (data) {
  return _.map(logFormatterSingle, data)
}

module.exports = {
  createCashboxBatch,
  updateMachineWithBatch,
  getBatches,
  getBillsByBatchId,
  editBatchById,
  getBatchById,
  getMachineUnbatchedBills,
  logFormatter
}
