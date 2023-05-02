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
  })
}

function updateMachineWithBatch (machineContext, oldCashboxCount) {
  const cashUnits = machineContext.cashUnits
  const isValidContext = _.has(['deviceId', 'cashUnits'], machineContext) && _.has(['cashbox', 'cassette1', 'cassette2', 'cassette3', 'cassette4', 'stacker1f', 'stacker1r', 'stacker2f', 'stacker2r', 'stacker3f', 'stacker3r'], cashUnits)
  const cassettes = _.filter(it => !_.isNil(it))([cashUnits.cassette1, cashUnits.cassette2, cashUnits.cassette3, cashUnits.cassette4])
  const isCassetteAmountWithinRange = _.inRange(constants.CASH_OUT_MINIMUM_AMOUNT_OF_CASSETTES, constants.CASH_OUT_MAXIMUM_AMOUNT_OF_CASSETTES + 1, _.size(cassettes))
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
    const q3 = t.none(`UPDATE devices SET cashbox=$1, cassette1=$2, cassette2=$3, cassette3=$4, cassette4=$5, stacker1f=$6, stacker1r=$7, stacker2f=$8, stacker2r=$9, stacker3f=$10, stacker3r=$11 WHERE device_id=$12`, [
      cashUnits.cashbox,
      cashUnits.cassette1,
      cashUnits.cassette2,
      cashUnits.cassette3,
      cashUnits.cassette4,
      cashUnits.stacker1f,
      cashUnits.stacker1r,
      cashUnits.stacker2f,
      cashUnits.stacker2r,
      cashUnits.stacker3f,
      cashUnits.stacker3r,
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

function logFormatter (data) {
  return _.map(
    it => {
      const bills = _.filter(
        ite => !(_.isNil(ite) || _.isNil(ite.fiat_code) || _.isNil(ite.fiat) || _.isNaN(ite.fiat)),
        it.bills
      )
      return {
        id: it.id,
        deviceId: it.deviceId,
        created: it.created,
        operationType: it.operationType,
        billCount: _.size(bills),
        fiatTotals: _.reduce(
          (acc, value) => {
            acc[value.fiat_code] = (acc[value.fiat_code] || 0) + value.fiat
            return acc
          },
          {},
          bills
        ),
        billsByDenomination: _.countBy(ite => `${ite.fiat} ${ite.fiat_code}`, bills)
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
