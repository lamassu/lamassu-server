const _ = require('lodash/fp')
const moment = require('moment')

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

function clearOldLogs () {
  const sql = `delete from logs
    where timestamp < now() - interval '3 days'`

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

function getMachineLogs (deviceId, until = new Date().toISOString(), limit = null, offset = 0) {
  const sql = `select id, log_level, timestamp, message from logs
  where device_id=$1
  and timestamp <= $2
  order by timestamp desc, serial desc
  limit $3
  offset $4`

  return Promise.all([db.any(sql, [ deviceId, until, limit, offset ]), getMachineName(deviceId)])
    .then(([logs, machineName]) => ({
      logs: _.map(_.mapKeys(_.camelCase), logs),
      currentMachine: {deviceId, name: machineName}
    }))
}

function simpleGetMachineLogs (deviceId, from = new Date(0).toISOString(), until = new Date().toISOString(), limit = null, offset = 0) {
  const sql = `select id, log_level, timestamp, message from logs
  where device_id=$1
  and timestamp >= $2
  and timestamp <= $3
  order by timestamp desc, serial desc
  limit $4
  offset $5`

  return db.any(sql, [ deviceId, from, until, limit, offset ])
    .then(_.map(_.mapKeys(_.camelCase)))
}

function logDateFormat (timezone, logs, fields) {
  const offset = timezone.split(':')[1]

  return _.map(log => {
    const values = _.map(field => moment.utc(log[field]).utcOffset(parseInt(offset)).format('YYYY-MM-DDTHH:mm:ss.SSS'), fields)
    const fieldsToOverride = _.zipObject(fields, values)

    return {
      ...log,
      ...fieldsToOverride
    }
  }, logs)
}

module.exports = { getUnlimitedMachineLogs, getMachineLogs, simpleGetMachineLogs, update, getLastSeen, clearOldLogs, logDateFormat }
