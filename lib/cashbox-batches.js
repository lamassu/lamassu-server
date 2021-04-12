const db = require('./db')
const _ = require('lodash/fp')

function createCashboxBatch (rec) {
  const sql = 'INSERT INTO cashbox_batches (device_id, created) VALUES ($1, now()) RETURNING *'
  const sql2 = ` 
    UPDATE bills SET cashbox_batch_id=$1
    FROM cash_in_txs
    WHERE bills.cash_in_txs_id = cash_in_txs.id AND
          cash_in_txs.device_id = $2 AND 
          bills.cashbox_batch_id IS NULL
  `
  return db.tx(async t => {
    const newBatch = await t.oneOrNone(sql, [rec.deviceId])
    return t.oneOrNone(sql2, [newBatch.id, newBatch.device_id])
  })
}

function getBatches () {
  const sql = `SELECT cb.id, cb.device_id, cb.created, cb.operation_type, cb.bill_count_override, cb.performed_by,
  json_agg(b.*) AS bills FROM cashbox_batches cb LEFT JOIN bills b ON cb.id=b.cashbox_batch_id GROUP BY cb.id`
  return db.any(sql).then(res => _.map(it => ({
    id: it.id,
    deviceId: it.device_id,
    created: it.created,
    operationType: it.operation_type,
    billCountOverride: it.bill_count_override,
    performedBy: it.performed_by,
    bills: it.bills
  }), res))
}

function getBillsByBatchId (id) {
  const sql = `SELECT * FROM bills WHERE cashbox_batch_id=$1`
  return db.any(sql, [id])
}

module.exports = { createCashboxBatch, getBatches, getBillsByBatchId }
