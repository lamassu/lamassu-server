const _ = require('lodash/fp')
const pgp = require('pg-promise')()

const db = require('../../db')
const machineLoader = require('../../machine-loader')
const tx = require('../../tx')
const cashInTx = require('../../cash-in/cash-in-tx')
const { REDEEMABLE_AGE, CASH_OUT_TRANSACTION_STATES } = require('../../cash-out/cash-out-helper')

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

function batch (
  from = new Date(0).toISOString(),
  until = new Date().toISOString(),
  limit = null,
  offset = 0,
  id = null,
  txClass = null,
  machineName = null,
  customerName = null,
  fiatCode = null,
  cryptoCode = null,
  toAddress = null,
  status = null,
  simplified = false
) {
  const packager = _.flow(_.flatten, _.orderBy(_.property('created'), ['desc']), _.map(camelize), addNames)

  const cashInSql = `SELECT 'cashIn' AS tx_class, txs.*,
  c.phone AS customer_phone,
  c.id_card_data_number AS customer_id_card_data_number,
  c.id_card_data_expiration AS customer_id_card_data_expiration,
  c.id_card_data AS customer_id_card_data,
  concat(c.id_card_data::json->>'firstName', ' ', c.id_card_data::json->>'lastName') AS customer_name,
  c.front_camera_path AS customer_front_camera_path,
  c.id_card_photo_path AS customer_id_card_photo_path,
  txs.tx_customer_photo_at AS tx_customer_photo_at,
  txs.tx_customer_photo_path AS tx_customer_photo_path,
  ((NOT txs.send_confirmed) AND (txs.created <= now() - interval $1)) AS expired
  FROM (SELECT *, ${cashInTx.TRANSACTION_STATES} AS txStatus FROM cash_in_txs) AS txs
  LEFT OUTER JOIN customers c ON txs.customer_id = c.id
  INNER JOIN devices d ON txs.device_id = d.device_id
  WHERE txs.created >= $2 AND txs.created <= $3 ${
  id !== null ? `AND txs.device_id = $6` : ``
}
  AND ($7 is null or $7 = 'Cash In')
  AND ($8 is null or d.name = $8)
  AND ($9 is null or concat(c.id_card_data::json->>'firstName', ' ', c.id_card_data::json->>'lastName') = $9)
  AND ($10 is null or txs.fiat_code = $10)
  AND ($11 is null or txs.crypto_code = $11)
  AND ($12 is null or txs.to_address = $12)
  AND ($13 is null or txs.txStatus = $13)
  AND (fiat > 0)
  ORDER BY created DESC limit $4 offset $5`

  const cashOutSql = `SELECT 'cashOut' AS tx_class,
  txs.*,
  actions.tx_hash,
  c.phone AS customer_phone,
  c.id_card_data_number AS customer_id_card_data_number,
  c.id_card_data_expiration AS customer_id_card_data_expiration,
  c.id_card_data AS customer_id_card_data,
  concat(c.id_card_data::json->>'firstName', ' ', c.id_card_data::json->>'lastName') AS customer_name,
  c.front_camera_path AS customer_front_camera_path,
  c.id_card_photo_path AS customer_id_card_photo_path,
  txs.tx_customer_photo_at AS tx_customer_photo_at,
  txs.tx_customer_photo_path AS tx_customer_photo_path,
  (extract(epoch FROM (now() - greatest(txs.created, txs.confirmed_at))) * 1000) >= $1 AS expired
  FROM (SELECT *, ${CASH_OUT_TRANSACTION_STATES} AS txStatus FROM cash_out_txs) txs
  INNER JOIN cash_out_actions actions ON txs.id = actions.tx_id
  AND actions.action = 'provisionAddress'
  LEFT OUTER JOIN customers c ON txs.customer_id = c.id
  INNER JOIN devices d ON txs.device_id = d.device_id
  WHERE txs.created >= $2 AND txs.created <= $3 ${
  id !== null ? `AND txs.device_id = $6` : ``
}
  AND ($7 is null or $7 = 'Cash Out')
  AND ($8 is null or d.name = $8)
  AND ($9 is null or concat(c.id_card_data::json->>'firstName', ' ', c.id_card_data::json->>'lastName') = $9)
  AND ($10 is null or txs.fiat_code = $10)
  AND ($11 is null or txs.crypto_code = $11)
  AND ($12 is null or txs.to_address = $12)
  AND ($13 is null or txs.txStatus = $13)
  AND (fiat > 0)
  ORDER BY created DESC limit $4 offset $5`

  return Promise.all([
    db.any(cashInSql, [cashInTx.PENDING_INTERVAL, from, until, limit, offset, id, txClass, machineName, customerName, fiatCode, cryptoCode, toAddress, status]),
    db.any(cashOutSql, [REDEEMABLE_AGE, from, until, limit, offset, id, txClass, machineName, customerName, fiatCode, cryptoCode, toAddress, status])
  ])
    .then(packager)
    .then(res => {
      if (simplified) return simplifiedBatch(res)
      else return res
    })
}

function simplifiedBatch (data) {
  const fields = ['txClass', 'id', 'created', 'machineName',
    'cryptoCode', 'fiat', 'fiatCode', 'phone', 'toAddress',
    'txHash', 'dispense', 'error', 'status', 'fiatProfit', 'cryptoAmount']

  const addSimplifiedFields = _.map(it => ({
    ...it,
    status: getStatus(it),
    fiatProfit: getProfit(it).toString(),
    cryptoAmount: getCryptoAmount(it)
  }))

  return _.compose(_.map(_.pick(fields)), addSimplifiedFields)(data)
}

const getCryptoAmount = it => coinUtils.toUnit(BN(it.cryptoAtoms), it.cryptoCode).toString()

const getProfit = it => {
  const getCommissionFee = it => BN(it.commissionPercentage).mul(BN(it.fiat))
  if (!it.cashInFee) return getCommissionFee(it)
  return getCommissionFee(it).add(BN(it.cashInFee))
}

const getCashOutStatus = it => {
  if (it.hasError) return 'Error'
  if (it.dispense) return 'Success'
  if (it.expired) return 'Expired'
  return 'Pending'
}

const getCashInStatus = it => {
  if (it.operatorCompleted) return 'Cancelled'
  if (it.hasError) return 'Error'
  if (it.sendConfirmed) return 'Sent'
  if (it.expired) return 'Expired'
  return 'Pending'
}

const getStatus = it => {
  if (it.txClass === 'cashOut') {
    return getCashOutStatus(it)
  }
  return getCashInStatus(it)
}

function getCustomerTransactionsBatch (ids) {
  const packager = _.flow(it => {
    return it
  }, _.flatten, _.orderBy(_.property('created'), ['desc']), _.map(camelize), addNames)

  const cashInSql = `SELECT 'cashIn' AS tx_class, txs.*,
  c.phone AS customer_phone,
  c.id_card_data_number AS customer_id_card_data_number,
  c.id_card_data_expiration AS customer_id_card_data_expiration,
  c.id_card_data AS customer_id_card_data,
  c.name AS customer_name,
  c.front_camera_path AS customer_front_camera_path,
  c.id_card_photo_path AS customer_id_card_photo_path,
  ((NOT txs.send_confirmed) AND (txs.created <= now() - interval $2)) AS expired
  FROM cash_in_txs AS txs
  LEFT OUTER JOIN customers c ON txs.customer_id = c.id
  WHERE c.id IN ($1^)
  ORDER BY created DESC limit $3`

  const cashOutSql = `SELECT 'cashOut' AS tx_class,
  txs.*,
  actions.tx_hash,
  c.phone AS customer_phone,
  c.id_card_data_number AS customer_id_card_data_number,
  c.id_card_data_expiration AS customer_id_card_data_expiration,
  c.id_card_data AS customer_id_card_data,
  c.name AS customer_name,
  c.front_camera_path AS customer_front_camera_path,
  c.id_card_photo_path AS customer_id_card_photo_path,
  (extract(epoch FROM (now() - greatest(txs.created, txs.confirmed_at))) * 1000) >= $3 AS expired
  FROM cash_out_txs txs
  INNER JOIN cash_out_actions actions ON txs.id = actions.tx_id
  AND actions.action = 'provisionAddress'
  LEFT OUTER JOIN customers c ON txs.customer_id = c.id
  WHERE c.id IN ($1^)
  ORDER BY created DESC limit $2`
  return Promise.all([
    db.any(cashInSql, [_.map(pgp.as.text, ids).join(','), cashInTx.PENDING_INTERVAL, NUM_RESULTS]),
    db.any(cashOutSql, [_.map(pgp.as.text, ids).join(','), NUM_RESULTS, REDEEMABLE_AGE])
  ])
    .then(packager).then(transactions => {
      const transactionMap = _.groupBy('customerId', transactions)
      return ids.map(id => transactionMap[id])
    })
}

function single (txId) {
  const packager = _.flow(_.compact, _.map(camelize), addNames)

  const cashInSql = `SELECT 'cashIn' AS tx_class, txs.*,
  c.phone AS customer_phone,
  c.id_card_data_number AS customer_id_card_data_number,
  c.id_card_data_expiration AS customer_id_card_data_expiration,
  c.id_card_data AS customer_id_card_data,
  c.name AS customer_name,
  c.front_camera_path AS customer_front_camera_path,
  c.id_card_photo_path AS customer_id_card_photo_path,
  ((NOT txs.send_confirmed) AND (txs.created <= now() - interval $1)) AS expired
  FROM cash_in_txs AS txs
  LEFT OUTER JOIN customers c ON txs.customer_id = c.id
  WHERE id=$2`

  const cashOutSql = `SELECT 'cashOut' AS tx_class,
  txs.*,
  actions.tx_hash,
  c.phone AS customer_phone,
  c.id_card_data_number AS customer_id_card_data_number,
  c.id_card_data_expiration AS customer_id_card_data_expiration,
  c.id_card_data AS customer_id_card_data,
  c.name AS customer_name,
  c.front_camera_path AS customer_front_camera_path,
  
  c.id_card_photo_path AS customer_id_card_photo_path,
  (extract(epoch FROM (now() - greatest(txs.created, txs.confirmed_at))) * 1000) >= $2 AS expired
  FROM cash_out_txs txs
  INNER JOIN cash_out_actions actions ON txs.id = actions.tx_id
  AND actions.action = 'provisionAddress'
  LEFT OUTER JOIN customers c ON txs.customer_id = c.id
  WHERE id=$1`

  return Promise.all([
    db.oneOrNone(cashInSql, [cashInTx.PENDING_INTERVAL, txId]),
    db.oneOrNone(cashOutSql, [txId, REDEEMABLE_AGE])
  ])
    .then(packager)
    .then(_.head)
}

function cancel (txId) {
  return tx.cancel(txId)
    .then(() => single(txId))
}

function getTx (txId, txClass) {
  const cashInSql = `select 'cashIn' as tx_class, txs.*,
  ((not txs.send_confirmed) and (txs.created <= now() - interval $1)) as expired
  from cash_in_txs as txs
  where txs.id=$2`

  const cashOutSql = `select 'cashOut' as tx_class,
  txs.*,
  (extract(epoch from (now() - greatest(txs.created, txs.confirmed_at))) * 1000) >= $2 as expired
  from cash_out_txs txs
  where txs.id=$1`

  return txClass === 'cashIn'
    ? db.oneOrNone(cashInSql, [cashInTx.PENDING_INTERVAL, txId])
    : db.oneOrNone(cashOutSql, [txId, REDEEMABLE_AGE])
}

function getTxAssociatedData (txId, txClass) {
  const billsSql = `select 'bills' as bills, b.* from bills b where cash_in_txs_id = $1`
  const actionsSql = `select 'cash_out_actions' as cash_out_actions, actions.* from cash_out_actions actions where tx_id = $1`

  return txClass === 'cashIn'
    ? db.manyOrNone(billsSql, [txId])
    : db.manyOrNone(actionsSql, [txId])
}

function updateTxCustomerPhoto (customerId, txId, direction, data) {
  const formattedData = _.mapKeys(_.snakeCase, data)
  const cashInSql = 'UPDATE cash_in_txs SET tx_customer_photo_at = $1, tx_customer_photo_path = $2 WHERE customer_id=$3 AND id=$4'

  const cashOutSql = 'UPDATE cash_out_txs SET tx_customer_photo_at = $1, tx_customer_photo_path = $2 WHERE customer_id=$3 AND id=$4'

  return direction === 'cashIn'
    ? db.oneOrNone(cashInSql, [formattedData.tx_customer_photo_at, formattedData.tx_customer_photo_path, customerId, txId])
    : db.oneOrNone(cashOutSql, [formattedData.tx_customer_photo_at, formattedData.tx_customer_photo_path, customerId, txId])
}

module.exports = {
  batch,
  single,
  cancel,
  getCustomerTransactionsBatch,
  getTx,
  getTxAssociatedData,
  updateTxCustomerPhoto
}
