const db = require('../../lib/db')
const Pgp = require('pg-promise')()
const _ = require('lodash/fp')
const cashInTx = require('../../lib/cash-in/cash-in-tx')
const { CASH_OUT_TRANSACTION_STATES, REDEEMABLE_AGE } = require('../../lib/cash-out/cash-out-helper')

const TX_PASSTHROUGH_ERROR_CODES = ['operatorCancel', 'scoreThresholdReached']

function filterTransaction () {
  const sql = `EXPLAIN ANALYZE
          SELECT DISTINCT * FROM (
          SELECT 'type' AS type, 'Cash In' AS value UNION
          SELECT 'type' AS type, 'Cash Out' AS value UNION
          SELECT 'machine' AS type, name AS value FROM devices d INNER JOIN cash_in_txs t ON d.device_id = t.device_id UNION
          SELECT 'machine' AS type, name AS value FROM devices d INNER JOIN cash_out_txs t ON d.device_id = t.device_id UNION
          SELECT 'customer' AS type, concat(id_card_data::json->>'firstName', ' ', id_card_data::json->>'lastName') AS value
          FROM customers c INNER JOIN cash_in_txs t ON c.id = t.customer_id
          WHERE c.id_card_data::json->>'firstName' IS NOT NULL or c.id_card_data::json->>'lastName' IS NOT NULL UNION
          SELECT 'customer' AS type, concat(id_card_data::json->>'firstName', ' ', id_card_data::json->>'lastName') AS value
          FROM customers c INNER JOIN cash_out_txs t ON c.id = t.customer_id
          WHERE c.id_card_data::json->>'firstName' IS NOT NULL or c.id_card_data::json->>'lastName' IS NOT NULL UNION
          SELECT 'fiat' AS type, fiat_code AS value FROM cash_in_txs UNION
          SELECT 'fiat' AS type, fiat_code AS value FROM cash_out_txs UNION
          SELECT 'crypto' AS type, crypto_code AS value FROM cash_in_txs UNION
          SELECT 'crypto' AS type, crypto_code AS value FROM cash_out_txs UNION
          SELECT 'address' AS type, to_address AS value FROM cash_in_txs UNION
          SELECT 'address' AS type, to_address AS value FROM cash_out_txs UNION
          SELECT 'status' AS type, ${cashInTx.TRANSACTION_STATES} AS value FROM cash_in_txs UNION
          SELECT 'status' AS type, ${CASH_OUT_TRANSACTION_STATES} AS value FROM cash_out_txs
        ) f`
  return db.any(sql)
}

function filterCustomer () {
  const sql = `EXPLAIN ANALYZE
          SELECT DISTINCT * FROM (
          SELECT 'phone' AS type, phone AS value FROM customers WHERE phone IS NOT NULL UNION
          SELECT 'name' AS type, id_card_data::json->>'firstName' AS value FROM customers WHERE id_card_data::json->>'firstName' IS NOT NULL AND id_card_data::json->>'lastName' IS NULL UNION
          SELECT 'name' AS type, id_card_data::json->>'lastName' AS value FROM customers WHERE id_card_data::json->>'firstName' IS NULL AND id_card_data::json->>'lastName' IS NOT NULL UNION
          SELECT 'name' AS type, concat(id_card_data::json->>'firstName', ' ', id_card_data::json->>'lastName') AS value FROM customers WHERE id_card_data::json->>'firstName' IS NOT NULL AND id_card_data::json->>'lastName' IS NOT NULL UNION
          SELECT 'address' as type, id_card_data::json->>'address' AS value FROM customers WHERE id_card_data::json->>'address' IS NOT NULL UNION
          SELECT 'id' AS type, id_card_data::json->>'documentNumber' AS value FROM customers WHERE id_card_data::json->>'documentNumber' IS NOT NULL
        ) f`
  return db.any(sql)
}

function getCustomerById (id) {
  const passableErrorCodes = _.map(Pgp.as.text, TX_PASSTHROUGH_ERROR_CODES).join(',')

  const sql = `EXPLAIN ANALYZE
   select id, authorized_override, days_suspended, is_suspended, front_camera_path, front_camera_override,
    phone, sms_override,  id_card_data, id_card_data_override, id_card_data_expiration,
    id_card_photo_path, id_card_photo_override, us_ssn, us_ssn_override, sanctions, sanctions_at,
    sanctions_override, total_txs, total_spent, created as last_active, fiat as last_tx_fiat,
    fiat_code as last_tx_fiat_code, tx_class as last_tx_class, subscriber_info
    from (
      select c.id, c.authorized_override,
      greatest(0, date_part('day', c.suspended_until - now())) as days_suspended,
      c.suspended_until > now() as is_suspended,
      c.front_camera_path, c.front_camera_override,
      c.phone, c.sms_override, c.id_card_data, c.id_card_data_override, c.id_card_data_expiration,
      c.id_card_photo_path, c.id_card_photo_override, c.us_ssn, c.us_ssn_override, c.sanctions,
      c.sanctions_at, c.sanctions_override, c.subscriber_info, t.tx_class, t.fiat, t.fiat_code, t.created, 
      row_number() over (partition by c.id order by t.created desc) as rn,
      sum(case when t.id is not null then 1 else 0 end) over (partition by c.id) as total_txs,
      sum(case when error_code is null or error_code not in ($1^) then t.fiat else 0 end) over (partition by c.id) as total_spent
      from customers c left outer join (
        select 'cashIn' as tx_class, id, fiat, fiat_code, created, customer_id, error_code
        from cash_in_txs where send_confirmed = true union
        select 'cashOut' as tx_class, id, fiat, fiat_code, created, customer_id, error_code
        from cash_out_txs where confirmed_at is not null) t on c.id = t.customer_id
      where c.id = $2
    ) as cl where rn = 1`
  return db.any(sql, [passableErrorCodes, id])
}

function simpleGetMachineLogs (deviceId, from = new Date(0).toISOString(), until = new Date().toISOString(), limit = null, offset = 0) {
  const sql = `EXPLAIN ANALYZE
    select id, log_level, timestamp, message from logs
      where device_id=$1
      and timestamp >= $2
      and timestamp <= $3
      order by timestamp desc, serial desc
      limit $4
      offset $5`
  return db.any(sql, [ deviceId, from, until, limit, offset ])
}

function batchCashIn (
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
  const cashInSql = `EXPLAIN ANALYZE
  SELECT 'cashIn' AS tx_class, txs.*,
  c.phone AS customer_phone,
  c.id_card_data_number AS customer_id_card_data_number,
  c.id_card_data_expiration AS customer_id_card_data_expiration,
  c.id_card_data AS customer_id_card_data,
  concat(c.id_card_data::json->>'firstName', ' ', c.id_card_data::json->>'lastName') AS customer_name,
  c.front_camera_path AS customer_front_camera_path,
  c.id_card_photo_path AS customer_id_card_photo_path,
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

  return db.any(cashInSql, [cashInTx.PENDING_INTERVAL, from, until, limit, offset, id, txClass, machineName, customerName, fiatCode, cryptoCode, toAddress, status])
}

function batchCashOut (
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
  const cashOutSql = `EXPLAIN ANALYZE
  SELECT 'cashOut' AS tx_class,
  txs.*,
  actions.tx_hash,
  c.phone AS customer_phone,
  c.id_card_data_number AS customer_id_card_data_number,
  c.id_card_data_expiration AS customer_id_card_data_expiration,
  c.id_card_data AS customer_id_card_data,
  concat(c.id_card_data::json->>'firstName', ' ', c.id_card_data::json->>'lastName') AS customer_name,
  c.front_camera_path AS customer_front_camera_path,
  c.id_card_photo_path AS customer_id_card_photo_path,
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

  return db.any(cashOutSql, [REDEEMABLE_AGE, from, until, limit, offset, id, txClass, machineName, customerName, fiatCode, cryptoCode, toAddress, status])
}

function getTx (txId, txClass) {
  const cashInSql = `EXPLAIN ANALYZE
  select 'cashIn' as tx_class, txs.*,
  ((not txs.send_confirmed) and (txs.created <= now() - interval $1)) as expired
  from cash_in_txs as txs
  where txs.id=$2`

  const cashOutSql = `EXPLAIN ANALYZE
  select 'cashOut' as tx_class,
  txs.*,
  (extract(epoch from (now() - greatest(txs.created, txs.confirmed_at))) * 1000) >= $2 as expired
  from cash_out_txs txs
  where txs.id=$1`

  return txClass === 'cashIn'
    ? db.any(cashInSql, [cashInTx.PENDING_INTERVAL, txId])
    : db.any(cashOutSql, [txId, REDEEMABLE_AGE])
}

function getTxAssociatedData (txId, txClass) {
  const billsSql = `EXPLAIN ANALYZE select 'bills' as bills, b.* from bills b where cash_in_txs_id = $1`
  const actionsSql = `EXPLAIN ANALYZE select 'cash_out_actions' as cash_out_actions, actions.* from cash_out_actions actions where tx_id = $1`

  return txClass === 'cashIn'
    ? db.any(billsSql, [txId])
    : db.any(actionsSql, [txId])
}

const run = () => {
  const deviceId = '7526924341dc4a57f02b6411a85923de' // randomly generated by the load script
  const customerId = '99ac9999-9999-99e9-9999-9f99a9999999' // hardcoded on the current load script
  const cashOutTxId = 'c402a7ae-b8f7-4781-8080-1e9ab76d62b5' // randomly generated by the load script
  const cashInTxId = '4d8d89f4-7d77-4d30-87e8-be9de05deea7' // randomly generated by the load script

  const getExecutionTime = _.compose(_.get('QUERY PLAN'), _.last)
  Promise.all([filterCustomer(), filterTransaction(), getCustomerById(customerId), simpleGetMachineLogs(deviceId), batchCashIn(), batchCashOut(),
    getTx(cashInTxId, 'cashIn'), getTx(cashOutTxId, 'cashOut'), getTxAssociatedData(cashInTxId, 'cashIn'), getTxAssociatedData(cashOutTxId, 'cashOut')])
    .then(([filterCustomer, filterTransaction, getCustomerById, logs, batchCashIn, batchCashOut, getTxCashOut, getTxCashIn,
      getTxAssociatedDataCashIn, getTxAssociatedDataCashOut]) => {
      console.log(`filterCustomer => ${getExecutionTime(filterCustomer)}`)
      console.log(`filterTransaction => ${getExecutionTime(filterTransaction)}`)
      console.log(`getCustomerById => ${getExecutionTime(getCustomerById)}`)
      console.log(`batchCashOut + batchCashIn => ${getExecutionTime(batchCashOut) + ' + ' + getExecutionTime(batchCashIn)}  `)
      console.log(`getTx (cash-out) => ${getExecutionTime(getTxCashOut)}`)
      console.log(`getTx (cash-in)  => ${getExecutionTime(getTxCashIn)}`)
      console.log(`getTxAssociatedData (cash-in)  => ${getExecutionTime(getTxAssociatedDataCashIn)}`)
      console.log(`getTxAssociatedDataCashOut (cash-out)  => ${getExecutionTime(getTxAssociatedDataCashOut)}`)
    })
}

run()
