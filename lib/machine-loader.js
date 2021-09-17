const _ = require('lodash/fp')
const pgp = require('pg-promise')()
const axios = require('axios')
const uuid = require('uuid')

const db = require('./db')
const pairing = require('./pairing')
const { checkPings, checkStuckScreen } = require('./notifier')
const dbm = require('./postgresql_interface')
const configManager = require('./new-config-manager')
const settingsLoader = require('./new-settings-loader')
const notifierUtils = require('./notifier/utils')
const notifierQueries = require('./notifier/queries')

function getMachines () {
  return db.any('SELECT * FROM devices WHERE display=TRUE ORDER BY created')
    .then(rr => rr.map(r => ({
      deviceId: r.device_id,
      cashbox: r.cashbox,
      cassette1: r.cassette1,
      cassette2: r.cassette2,
      version: r.version,
      model: r.model,
      pairedAt: new Date(r.created),
      lastPing: new Date(r.last_online),
      name: r.name,
      // TODO: we shall start using this JSON field at some point
      // location: r.location,
      paired: r.paired
    })))
}

function getConfig (defaultConfig) {
  if (defaultConfig) return Promise.resolve(defaultConfig)

  return settingsLoader.loadLatest().config
}

function getMachineNames (config) {
  const fullyFunctionalStatus = { label: 'Fully functional', type: 'success' }
  const unresponsiveStatus = { label: 'Unresponsive', type: 'error' }
  const stuckStatus = { label: 'Stuck', type: 'error' }

  return Promise.all([getMachines(), getConfig(config), getNetworkHeartbeat(), getNetworkPerformance()])
    .then(([rawMachines, config, heartbeat, performance]) => Promise.all(
      [rawMachines, checkPings(rawMachines), dbm.machineEvents(), config, heartbeat, performance]
    ))
    .then(([rawMachines, pings, events, config, heartbeat, performance]) => {
      const mergeByDeviceId = (x, y) => _.values(_.merge(_.keyBy('deviceId', x), _.keyBy('deviceId', y)))
      const machines = mergeByDeviceId(mergeByDeviceId(rawMachines, heartbeat), performance)

      const getStatus = (ping, stuck) => {
        if (ping && ping.age) return unresponsiveStatus

        if (stuck && stuck.age) return stuckStatus

        return fullyFunctionalStatus
      }

      const addName = r => {
        const cashOutConfig = configManager.getCashOut(r.deviceId, config)

        const cashOut = !!cashOutConfig.active

        const statuses = [
          getStatus(
            _.first(pings[r.deviceId]),
            _.first(checkStuckScreen(events, r.name))
          )
        ]

        return _.assign(r, { cashOut, statuses })
      }
      return _.map(addName, machines)
    })
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
  const sql = 'SELECT * FROM devices WHERE device_id=$1'
  return db.oneOrNone(sql, [machineId])
    .then(it => it.name)
}

function getMachine (machineId) {
  const sql = 'SELECT * FROM devices WHERE device_id=$1'
  return db.oneOrNone(sql, [machineId]).then(res => _.mapKeys(_.camelCase)(res))
}

function renameMachine (rec) {
  const sql = 'UPDATE devices SET name=$1 WHERE device_id=$2'
  return db.none(sql, [rec.newName, rec.deviceId])
}

function resetCashOutBills (rec) {
  const detailB = notifierUtils.buildDetail({ deviceId: rec.deviceId })
  const sql = `UPDATE devices SET cassette1=$1, cassette2=$2 WHERE device_id=$3;`
  return db.none(sql, [rec.cassettes[0], rec.cassettes[1], rec.deviceId]).then(() => notifierQueries.invalidateNotification(detailB, 'fiatBalance'))
}

function emptyCashInBills (rec) {
  const sql = 'UPDATE devices SET cashbox=0 WHERE device_id=$1'
  return db.none(sql, [rec.deviceId])
}

function setCassetteBills (rec) {
  const sql = 'update devices set cashbox=$1, cassette1=$2, cassette2=$3 where device_id=$4'
  return db.none(sql, [rec.cashbox, rec.cassettes[0], rec.cassettes[1], rec.deviceId])
}

function unpair (rec) {
  return pairing.unpair(rec.deviceId)
}

function reboot (rec) {
  return db.none('NOTIFY $1:name, $2', ['poller', JSON.stringify(
    { 
      type: 'machineAction',
      action: 'reboot',
      value: _.pick(['deviceId', 'operatorId', 'action'], rec)
    }
  )])
}

function shutdown (rec) {
  return db.none('NOTIFY $1:name, $2', ['poller', JSON.stringify(
    { 
      type: 'machineAction',
      action: 'shutdown',
      value: _.pick(['deviceId', 'operatorId', 'action'], rec)
    }
  )])
}

function restartServices (rec) {
  return db.none('NOTIFY $1:name, $2', ['poller', JSON.stringify(
    { 
      type: 'machineAction',
      action: 'restartServices',
      value: _.pick(['deviceId', 'operatorId', 'action'], rec)
    }
  )])
}

function setMachine (rec, operatorId) {
  rec.operatorId = operatorId
  switch (rec.action) {
    case 'rename': return renameMachine(rec)
    case 'emptyCashInBills': return emptyCashInBills(rec)
    case 'resetCashOutBills': return resetCashOutBills(rec)
    case 'setCassetteBills': return setCassetteBills(rec)
    case 'unpair': return unpair(rec)
    case 'reboot': return reboot(rec)
    case 'shutdown': return shutdown(rec)
    case 'restartServices': return restartServices(rec)
    default: throw new Error('No such action: ' + rec.action)
  }
}

function updateNetworkPerformance (deviceId, data) {
  const downloadSpeed = _.head(data)
  const dbData = {
    device_id: deviceId,
    download_speed: downloadSpeed.speed,
    created: new Date()
  }
  const cs = new pgp.helpers.ColumnSet(['device_id', 'download_speed', 'created'],
    { table: 'machine_network_performance' })
  const onConflict = ' ON CONFLICT (device_id) DO UPDATE SET ' +
    cs.assignColumns({ from: 'EXCLUDED', skip: ['device_id'] })
  const upsert = pgp.helpers.insert(dbData, cs) + onConflict
  return db.none(upsert)
}

function updateNetworkHeartbeat (deviceId, data) {
  const avgResponseTime = _.meanBy(e => _.toNumber(e.averageResponseTime), data)
  const avgPacketLoss = _.meanBy(e => _.toNumber(e.packetLoss), data)
  const dbData = {
    id: uuid.v4(),
    device_id: deviceId,
    average_response_time: avgResponseTime,
    average_packet_loss: avgPacketLoss
  }
  const sql = pgp.helpers.insert(dbData, null, 'machine_network_heartbeat')
  return db.none(sql)
}

function getNetworkPerformance () {
  const sql = `SELECT device_id, download_speed FROM machine_network_performance`
  return db.manyOrNone(sql)
    .then(res => _.map(_.mapKeys(_.camelCase))(res))
}

function getNetworkHeartbeat () {
  const sql = `SELECT AVG(average_response_time) AS response_time, AVG(average_packet_loss) AS packet_loss, device_id
    FROM machine_network_heartbeat 
    GROUP BY device_id`
  return db.manyOrNone(sql)
    .then(res => _.map(_.mapKeys(_.camelCase))(res))
}

module.exports = {
  getMachineName,
  getMachines,
  getMachine,
  getMachineNames,
  setMachine,
  updateNetworkPerformance,
  updateNetworkHeartbeat,
  getNetworkPerformance,
  getNetworkHeartbeat
}
