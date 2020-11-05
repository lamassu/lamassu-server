const db = require('../db')
const cashInTx = require('../cash-in/cash-in-tx')
const { CASH_OUT_TRANSACTION_STATES } = require('../cash-out/cash-out-helper')

function transaction() {
  const sql = `select distinct * from (
    select 'type' as type, 'Cash In' as value union
    select 'type' as type, 'Cash Out' as value union
    select 'machine' as type, name as value from devices d inner join cash_in_txs t on d.device_id = t.device_id union
    select 'machine' as type, name as value from devices d inner join cash_out_txs t on d.device_id = t.device_id union
    select 'customer' as type, concat(id_card_data::json->>'firstName', ' ', id_card_data::json->>'lastName') as value
    from customers c inner join cash_in_txs t on c.id = t.customer_id
    where c.id_card_data::json->>'firstName' is not null or c.id_card_data::json->>'lastName' is not null union
    select 'customer' as type, concat(id_card_data::json->>'firstName', ' ', id_card_data::json->>'lastName') as value
    from customers c inner join cash_out_txs t on c.id = t.customer_id
    where c.id_card_data::json->>'firstName' is not null or c.id_card_data::json->>'lastName' is not null union
    select 'fiat' as type, fiat_code as value from cash_in_txs union
    select 'fiat' as type, fiat_code as value from cash_out_txs union
    select 'crypto' as type, crypto_code as value from cash_in_txs union
    select 'crypto' as type, crypto_code as value from cash_out_txs union
    select 'address' as type, to_address as value from cash_in_txs union
    select 'address' as type, to_address as value from cash_in_txs union
    select 'status' as type, ${cashInTx.TRANSACTION_STATES} as value from cash_in_txs union
    select 'status' as type, ${CASH_OUT_TRANSACTION_STATES} as value from cash_out_txs
  ) f`

  return db.any(sql)
}

module.exports = { transaction }
