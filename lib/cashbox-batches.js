const db = require('./db')
const _ = require('lodash/fp')
const uuid = require('uuid')

function createCashboxBatch (deviceId, cashboxCount) {
  if (_.isEqual(0, cashboxCount)) throw new Error('Cashbox is empty. Cashbox batch could not be created.')
  const sql = `INSERT INTO cashbox_batches (id, device_id, created, operation_type) VALUES ($1, $2, now(), 'cash-in-empty') RETURNING *`
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
  })
}

function getBatches () {
  const sql = `SELECT cb.id, cb.device_id, cb.created, cb.operation_type, cb.bill_count_override, cb.performed_by,
  json_agg(b.*) AS bills FROM cashbox_batches cb LEFT JOIN bills b ON cb.id=b.cashbox_batch_id GROUP BY cb.id`
  return db.any(sql).then(res => _.map(it => _.mapKeys(ite => _.camelCase(ite), it), res))
}

function editBatchById (id, performedBy) {
  const sql = `UPDATE cashbox_batches SET performed_by=$1 WHERE id=$2`
  return db.none(sql, [performedBy, id])
}

function getBillsByBatchId (id) {
  const sql = `SELECT * FROM bills WHERE cashbox_batch_id=$1`
  return db.any(sql, [id])
}

module.exports = { createCashboxBatch, getBatches, getBillsByBatchId, editBatchById }
