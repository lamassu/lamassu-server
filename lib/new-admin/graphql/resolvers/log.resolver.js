const { parseAsync } = require('json2csv')
const _ = require('lodash/fp')

const logs = require('../../../logs')
const serverLogs = require('../../services/server-logs')

const resolvers = {
  Query: {
    machineLogs: (...[, { deviceId, from, until, limit, offset }]) =>
      logs.simpleGetMachineLogs(deviceId, from, until, limit, offset),
    machineLogsCsv: (...[, { deviceId, from, until, limit, offset, timezone }]) =>
      logs.simpleGetMachineLogs(deviceId, from, until, limit, offset)
        .then(res => parseAsync(logs.logDateFormat(timezone, res, ['timestamp']))),
    serverLogs: (...[, { from, until, limit, offset }]) =>
      serverLogs.getServerLogs(from, until, limit, offset),
    serverLogsCsv: (...[, { from, until, limit, offset, timezone }]) =>
      serverLogs.getServerLogs(from, until, limit, offset)
        .then(res => parseAsync(logs.logDateFormat(timezone, res, ['timestamp'])))
  }
}

module.exports = resolvers
