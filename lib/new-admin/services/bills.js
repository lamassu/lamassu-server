const _ = require('lodash/fp')
const pgp = require('pg-promise')()

const db = require('../../db')

const getBills = filters => {
  const deviceStatement = !_.isNil(filters.deviceId) ? `WHERE device_id = ${pgp.as.text(filters.deviceId)}` : ``
  const batchStatement = filter => {
    switch (filter) {
      case 'none':
        return `WHERE b.cashbox_batch_id IS NULL`
      case 'any':
        return `WHERE b.cashbox_batch_id IS NOT NULL`
      default:
        return _.isNil(filter) ? `` : `WHERE b.cashbox_batch_id = ${pgp.as.text(filter)}`
    }
  }

  const sql = `SELECT b.id, b.fiat, b.fiat_code, b.created, b.cashbox_batch_id, cit.device_id AS device_id FROM bills b LEFT OUTER JOIN (
    SELECT id, device_id FROM cash_in_txs ${deviceStatement}
  ) AS cit ON cit.id = b.cash_in_txs_id ${batchStatement(filters.batch)}`

  return db.any(sql)
    .then(res => _.map(_.mapKeys(_.camelCase), res))
}

module.exports = {
  getBills
}
