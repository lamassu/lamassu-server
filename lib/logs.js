const _ = require('lodash/fp')

const db = require('./db')
const pgp = require('pg-promise')()

const settingsLoader = require('./settings-loader')
const configManager = require('./config-manager')

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
      logLevel: log.level,
      timestamp: log.timestamp
    }
    return _.mapKeys(_.snakeCase, formatted)
  }, logLines)
  const sql = pgp.helpers.insert(logs, cs)
  return db.none(sql)
}

/**
 * Get all logs by machine id
 *
 * @name list
 * @function
 *
 * @param {string} deviceId Machine id to fetch the logs for
 *
 * @returns {array} Array of logs for the requested machinej
 */
function getMachineLogs (deviceId) {
  const sql = `select id, log_level, timestamp, message from logs
  where device_id=$1
  order by timestamp desc limit $2`
  return Promise.all([db.any(sql, [ deviceId, NUM_RESULTS ]), getMachineName(deviceId)])
  .then(([logs, machineName]) => ({
    logs: _.map(_.mapKeys(_.camelCase), logs),
    currentMachine: {deviceId, name: machineName}
  }))
}

/**
 * Given the machine id, get the machine name
 *
 * @name getMachineName
 * @function
 * @async
 *
 * @param {string} machineId machine id
 * @returns {string} machine name
 */
function getMachineName (machineId) {
  return settingsLoader.loadRecentConfig()
  .then(config => {
    const machineScoped = configManager.machineScoped(machineId, config)
    return machineScoped.machineName
  })
}

module.exports = { getMachineLogs, update, getLastSeen }
