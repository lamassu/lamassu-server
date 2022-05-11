const db = require('./db')
const _ = require('lodash/fp')

function getOperatorId (service) {
  const sql = `SELECT operator_id FROM operator_ids WHERE service = '${service}'`
  return db.oneOrNone(sql)
    .then(_.mapKeys(_.camelCase))
}

module.exports = { getOperatorId }
