const _ = require('lodash/fp')
const uuid = require('uuid')

const db = require('../db')

const NUM_RESULTS = 500

function getServerLogs (until = new Date().toISOString()) {
  const sql = `select id, log_level, timestamp, message from server_logs
  order by timestamp desc
  limit $1`

  return Promise.all([db.any(sql, [ NUM_RESULTS ])])
    .then(([logs]) => ({
      logs: _.map(_.mapKeys(_.camelCase), logs)
    }))
}

function insert () {
  const sql = `insert into server_support_logs
  (id) values ($1) returning *`
  return db.one(sql, [uuid.v4()])
    .then(_.mapKeys(_.camelCase))
}

module.exports = { getServerLogs, insert }
