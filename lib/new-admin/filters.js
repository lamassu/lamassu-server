const db = require('../db')
const cashInTx = require('../cash-in/cash-in-tx')
const { CASH_OUT_TRANSACTION_STATES } = require('../cash-out/cash-out-helper')

function transaction() {
  const sql = `SELECT distinct * FROM (
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
    SELECT 'address' AS type, to_address AS value FROM cash_in_txs UNION
    SELECT 'status' AS type, ${cashInTx.TRANSACTION_STATES} AS value FROM cash_in_txs UNION
    SELECT 'status' AS type, ${CASH_OUT_TRANSACTION_STATES} AS value FROM cash_out_txs
  ) f`

  return db.any(sql)
}

module.exports = { transaction }
