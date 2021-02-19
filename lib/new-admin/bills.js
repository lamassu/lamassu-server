const db = require('../db')

// Get all bills with device id
const getBills = () => {
  return db.any(`
  SELECT d.device_id, b.fiat, b.created, d.cashbox
    FROM cash_in_txs
      INNER JOIN bills AS b ON b.cash_in_txs_id = cash_in_txs.id
        INNER JOIN devices as d ON d.device_id = cash_in_txs.device_id
    ORDER BY device_id, created DESC`
  )
    .then(res => {
      return res.map(item => ({
        fiat: item.fiat,
        deviceId: item.device_id,
        cashbox: item.cashbox,
        created: item.created
      }))
    })
}

module.exports = {
  getBills
}
