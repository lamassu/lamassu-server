const _ = require('lodash/fp')

const db = require('./db')
const pgp = require('pg-promise')()

const getMachineName = require('./machine-loader').getMachineName
const NUM_RESULTS = 1000

/**
 * Get the latest log's timestamp
 *
 * @name getLastSeen
 * @function
 * @async
 *
 * @param {string} deviceId Machine id to get the last timestamp for
 *
 * @returns {date} Last timestamp
 */
function getLastSeen (deviceId) {
  const sql = `select timestamp from logs 
  where device_id=$1
  order by timestamp desc limit 1`
  return db.oneOrNone(sql, [deviceId])
  .then(log => log ? log.timestamp : null)
}

/**
 * Update logs in db
 *
 * @name update
 * @function
 * @async
 *
 * @param {string} deviceId Machine Id to which logs belong to
 * @param {array} logLines Logs to be saved
 *
 * @returns {null}
 */
function update (deviceId, logLines) {
  const cs = new pgp.helpers.ColumnSet([
    'id', 'device_id', 'log_level', 'timestamp', 'message'],
    {table: 'logs'})

  const logs = _.map(log => {
    const formatted = {
      id: log.id,
      deviceId: deviceId,
      message: log.msg,
      logLevel: _.contains('error', _.lowerCase(log.msg)) ? 'error' : 'info',
      timestamp: log.timestamp
    }
    return _.mapKeys(_.snakeCase, formatted)
  }, logLines)
  const sql = pgp.helpers.insert(logs, cs)
  return db.none(sql)
}

/**
 * Get all logs by machine id
 * and timestamp
 *
 * @name list
 * @function
 *
 * @param {string} deviceId Machine id to fetch the logs for
 * @param {date} until Show the logs until the date provided, defaults to now
 *
 * @returns {array} Array of logs for the requested machinej
 */
function getMachineLogs (deviceId, until = new Date().toISOString()) {
  const defaults = {
    logs: [],
    currentMachine: {
      name: '',
      deviceId: ''
    }
  }
  if (!deviceId) return defaults

  const sql = `select id, log_level, timestamp, message from logs
  where device_id=$1
  and timestamp <= $3
  order by timestamp asc limit $2`
  return Promise.all([db.any(sql, [ deviceId, NUM_RESULTS, until ]), getMachineName(deviceId)])
  .then(([logs, machineName]) => ({
    logs: _.map(_.mapKeys(_.camelCase), logs),
    currentMachine: {deviceId, name: machineName}
  }))
}

module.exports = { getMachineLogs, update, getLastSeen }
