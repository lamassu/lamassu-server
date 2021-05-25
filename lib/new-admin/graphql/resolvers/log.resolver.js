const { parseAsync } = require('json2csv')
const moment = require('moment')
const _ = require('lodash/fp')

const logs = require('../../../logs')
const serverLogs = require('../../services/server-logs')

const dateFormat = (timezone, logs) => _.map(log => {
  const offset = timezone.split(':')[1]
  return {
    ...log,
    timestamp: moment.utc(log.timestamp).utcOffset(parseInt(offset)).format('YYYY-MM-DDTHH:mm:ss.SSS')
  }
}, logs)

const resolvers = {
  Query: {
    machineLogs: (...[, { deviceId, from, until, limit, offset }]) =>
      logs.simpleGetMachineLogs(deviceId, from, until, limit, offset),
    machineLogsCsv: (...[, { deviceId, from, until, limit, offset, timezone }]) =>
      logs.simpleGetMachineLogs(deviceId, from, until, limit, offset)
        .then(res => parseAsync(dateFormat(timezone, res))),
    serverLogs: (...[, { from, until, limit, offset }]) =>
      serverLogs.getServerLogs(from, until, limit, offset),
    serverLogsCsv: (...[, { from, until, limit, offset, timezone }]) =>
      serverLogs.getServerLogs(from, until, limit, offset)
        .then(res => parseAsync(dateFormat(timezone, res)))
  }
}

module.exports = resolvers
