const _ = require('lodash/fp')

const db = require('./db')
const pgp = require('pg-promise')()

const getMachineName = require('./machine-loader').getMachineName
const NUM_RESULTS = 500

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
  const sql = `select id, timestamp, serial from logs
  where device_id=$1
  order by timestamp desc, serial desc limit 1`
  return db.oneOrNone(sql, [deviceId])
    .then(log => log ? {timestamp: log.timestamp, serial: log.serial, id: log.id} : null)
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
    'id', 'device_id', 'log_level', 'timestamp', 'serial', 'message'],
  {table: 'logs'})

  const logs = _.map(log => {
    const formatted = {
      id: log.id,
      deviceId: deviceId,
      message: log.msg,
      logLevel: _.contains('error', _.lowerCase(log.msg)) ? 'error' : 'info',
      timestamp: log.timestamp,
      serial: log.serial || 0
    }
    return _.mapKeys(_.snakeCase, formatted)
  }, logLines)
  const sql = pgp.helpers.insert(logs, cs) + 'on conflict do nothing'
  return db.none(sql)
}

function getUnlimitedMachineLogs (deviceId, until = new Date().toISOString()) {
  // Note: sql is a little confusing here, since timestamp is used both as a column
  // and a reserved word, but it works.
  const sql = `select id, log_level, timestamp, message from logs
  where device_id=$1
  and timestamp <= $2
  and timestamp > (timestamp $2 - interval '2 days')
  order by timestamp desc, serial desc`

  return Promise.all([db.any(sql, [ deviceId, until ]), getMachineName(deviceId)])
    .then(([logs, machineName]) => ({
      logs: _.map(_.mapKeys(_.camelCase), logs),
      currentMachine: {deviceId, name: machineName}
    }))
}

function getMachineLogs (deviceId, until = new Date().toISOString()) {
  const sql = `select id, log_level, timestamp, message from logs
  where device_id=$1
  and timestamp <= $3
  order by timestamp desc, serial desc
  limit $2`

  return Promise.all([db.any(sql, [ deviceId, NUM_RESULTS, until ]), getMachineName(deviceId)])
    .then(([logs, machineName]) => ({
      logs: _.map(_.mapKeys(_.camelCase), logs),
      currentMachine: {deviceId, name: machineName}
    }))
}

module.exports = { getUnlimitedMachineLogs, getMachineLogs, update, getLastSeen }
