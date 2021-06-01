const _ = require('lodash/fp')
const uuid = require('uuid')

const db = require('../db')

function getServerLogs (from = new Date(0).toISOString(), until = new Date().toISOString(), limit = null, offset = 0) {
  const sql = `select id, log_level, timestamp, message from server_logs
  where timestamp >= $1 and timestamp <= $2
  order by timestamp desc
  limit $3
  offset $4`

  return db.any(sql, [ from, until, limit, offset ])
    .then(_.map(_.mapKeys(_.camelCase)))
}

module.exports = { getServerLogs }
