const db = require('./db')

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

module.exports = { createCashboxBatch }
