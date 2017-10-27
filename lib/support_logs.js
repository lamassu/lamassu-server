const _ = require('lodash/fp')
const uuid = require('uuid')

const db = require('./db')

/**
 * Insert a single support_logs row in db
 *
 * @name insert
 * @function
 * @async
 *
 * @param {string} deviceId Machine's id for the log
 *
 * @returns {object} Newly created support_log
 */
function insert (deviceId) {
  const sql = `insert into support_logs 
  (id, device_id) values ($1, $2) returning *`
  return db.one(sql, [uuid.v4(), deviceId])
  .then(_.mapKeys(_.camelCase))
}

/**
 * Get the latest 48-hour logs
 *
 * @name batch
 * @function
 * @async
 *
 * @param {string} deviceId Machine's id
 * @param {date} timestamp Fetch the last 48-hour logs before this timestamp
 *
 * @returns {array} List of all support_logs rows
 */
function batch (timestamp) {
  const sql = `select * from support_logs 
           where timestamp > $1 - interval '2 days'
           order by timestamp desc`
  return db.oneOrNone(sql, [timestamp])
  .then(_.map(_.mapKeys(_.camelCase)))
}

module.exports = { insert, batch }
