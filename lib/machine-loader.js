const _ = require('lodash/fp')
const pgp = require('pg-promise')()
const axios = require('axios')
const uuid = require('uuid')

const batching = require('./cashbox-batches')
const db = require('./db')
const pairing = require('./pairing')
const { checkPings, checkStuckScreen } = require('./notifier')
const dbm = require('./postgresql_interface')
const configManager = require('./new-config-manager')
const settingsLoader = require('./new-settings-loader')
const notifierUtils = require('./notifier/utils')
const notifierQueries = require('./notifier/queries')
const manifest = require('../manifest.json')
const { ApolloError } = require('apollo-server-errors');

const fullyFunctionalStatus = { label: 'Fully functional', type: 'success' }
const unresponsiveStatus = { label: 'Unresponsive', type: 'error' }
const stuckStatus = { label: 'Stuck', type: 'error' }

function toMachineObject (r) {
  return {
    deviceId: r.device_id,
    cashbox: r.cashbox,
    cassette1: r.cassette1,
    cassette2: r.cassette2,
    cassette3: r.cassette3,
    cassette4: r.cassette4,
    numberOfCassettes: r.number_of_cassettes,
    version: r.version,
    model: r.model,
    pairedAt: new Date(r.created),
    lastPing: new Date(r.last_online),
    name: r.name,
    paired: r.paired
    // TODO: we shall start using this JSON field at some point
    // location: r.location,
  }
}

function getMachines () {
  return db.any('SELECT * FROM devices WHERE display=TRUE ORDER BY created')
    .then(rr => rr.map(toMachineObject))
}

function getUnpairedMachines () {
  return db.any('SELECT * FROM unpaired_devices')
    .then(_.map(r =>
      _.flow(
        _.set('deviceId', _.get('device_id', r)),
        _.unset('device_id')
      )(r)
    ))
}

function getConfig (defaultConfig) {
  if (defaultConfig) return Promise.resolve(defaultConfig)

  return settingsLoader.loadLatest().config
}

const getStatus = (ping, stuck) => {
  if (ping && ping.age) return unresponsiveStatus

  if (stuck && stuck.age) return stuckStatus

  return fullyFunctionalStatus
}

function addName (pings, events, config) {
  return machine => {
    const cashOutConfig = configManager.getCashOut(machine.deviceId, config)

    const cashOut = !!cashOutConfig.active

    const statuses = [
      getStatus(
        _.first(pings[machine.deviceId]),
        _.first(checkStuckScreen(events, machine))
      )
    ]

    return _.assign(machine, { cashOut, statuses })
  }
}

function getMachineNames (config) {
  return Promise.all([getMachines(), getConfig(config), getNetworkHeartbeat(), getNetworkPerformance()])
    .then(([rawMachines, config, heartbeat, performance]) => Promise.all(
      [rawMachines, checkPings(rawMachines), dbm.machineEvents(), config, heartbeat, performance]
    ))
    .then(([rawMachines, pings, events, config, heartbeat, performance]) => {
      const mergeByDeviceId = (x, y) => _.values(_.merge(_.keyBy('deviceId', x), _.keyBy('deviceId', y)))
      const machines = mergeByDeviceId(mergeByDeviceId(rawMachines, heartbeat), performance)

      return machines.map(addName(pings, events, config))
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

function getMachine (machineId, config) {
  const sql = 'SELECT * FROM devices WHERE device_id=$1'
  const queryMachine = db.oneOrNone(sql, [machineId]).then(r => {
    if (r === null) throw new ApolloError('Resource doesn\'t exist', 'NOT_FOUND')
    else return toMachineObject(r)
  })

  return Promise.all([queryMachine, dbm.machineEvents(), config, getNetworkHeartbeatByDevice(machineId), getNetworkPerformanceByDevice(machineId)])
    .then(([machine, events, config, heartbeat, performance]) => {
      const pings = checkPings([machine])
      const mergedMachine = {
        ...machine,
        responseTime: _.get('responseTime', heartbeat),
        packetLoss: _.get('packetLoss', heartbeat),
        downloadSpeed: _.get('downloadSpeed', performance),
      }

      return addName(pings, events, config)(mergedMachine)
    })
}

function renameMachine (rec) {
  const sql = 'UPDATE devices SET name=$1 WHERE device_id=$2'
  return db.none(sql, [rec.newName, rec.deviceId])
}

function resetCashOutBills (rec) {
  const detailB = notifierUtils.buildDetail({ deviceId: rec.deviceId })
  const sql = `UPDATE devices SET cassette1=$1, cassette2=$2, cassette3=$3, cassette4=$4 WHERE device_id=$5;`
  return db.none(sql, [rec.cassettes[0], rec.cassettes[1], rec.cassettes[2], rec.cassettes[3], rec.deviceId]).then(() => notifierQueries.invalidateNotification(detailB, 'fiatBalance'))
}

function emptyCashInBills (rec) {
  const sql = 'UPDATE devices SET cashbox=0 WHERE device_id=$1'
  return db.none(sql, [rec.deviceId])
}

function setCassetteBills (rec) {
  return db.oneOrNone(`SELECT cashbox FROM devices WHERE device_id=$1 LIMIT 1`, [rec.deviceId])
    .then(oldCashboxValue => {
      if (_.isNil(oldCashboxValue) || rec.cashbox === oldCashboxValue.cashbox) {
        const sql = 'UPDATE devices SET cashbox=$1, cassette1=$2, cassette2=$3, cassette3=$4, cassette4=$5 WHERE device_id=$6'
        return db.none(sql, [rec.cashbox, rec.cassettes[0], rec.cassettes[1], rec.cassettes[2], rec.cassettes[3], rec.deviceId])
      }

      return batching.updateMachineWithBatch({ ...rec, oldCashboxValue })
    })
}

function unpair (rec) {
  return pairing.unpair(rec.deviceId)
}

function reboot (rec) {
  return db.none('NOTIFY $1:name, $2', ['machineAction', JSON.stringify(
    { 
      action: 'reboot',
      value: _.pick(['deviceId', 'operatorId', 'action'], rec)
    }
  )])
}

function shutdown (rec) {
  return db.none('NOTIFY $1:name, $2', ['machineAction', JSON.stringify(
    { 
      action: 'shutdown',
      value: _.pick(['deviceId', 'operatorId', 'action'], rec)
    }
  )])
}

function restartServices (rec) {
  return db.none('NOTIFY $1:name, $2', ['machineAction', JSON.stringify(
    { 
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
  if (_.isEmpty(data)) return Promise.resolve(true)
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
  if (_.isEmpty(data)) return Promise.resolve(true)
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

function getNetworkPerformanceByDevice (deviceId) {
  const sql = `SELECT device_id, download_speed FROM machine_network_performance WHERE device_id = $1`
  return db.manyOrNone(sql, [deviceId])
    .then(res => _.mapKeys(_.camelCase, _.find(it => it.device_id === deviceId, res)))
}

function getNetworkHeartbeatByDevice (deviceId) {
  const sql = `SELECT AVG(average_response_time) AS response_time, AVG(average_packet_loss) AS packet_loss, device_id
    FROM machine_network_heartbeat WHERE device_id = $1
    GROUP BY device_id`
  return db.manyOrNone(sql, [deviceId])
    .then(res => _.mapKeys(_.camelCase, _.find(it => it.device_id === deviceId, res)))
}

function getMachinesUpdateStatus () {
  const sql = `SELECT * FROM machine_updates M1
  INNER JOIN (SELECT MAX(aux.created) as date, aux.device_id FROM machine_updates aux GROUP BY aux.device_id) M2
    ON (M1.created = M2.date)`
  return db.manyOrNone(sql)
    .then(res => _.map(_.mapKeys(_.camelCase))(res))
}

function getUpdateStatuses (deviceId) {
  const sql = `SELECT * FROM machine_updates WHERE device_id = $1 ORDER BY created DESC`
  return db.manyOrNone(sql, [deviceId])
    .then(res => _.map(_.mapKeys(_.camelCase))(res))
}

function recordUpdateEvent (deviceId, event, note) {
  return db.oneOrNone('SELECT * FROM devices WHERE device_id=$1', [deviceId])
    .then(it => {
      const updateInfo = getAvailableUpdates()
      const dbData = {
        id: uuid.v4(),
        device_id: deviceId,
        event: event,
        note: note,
        new_version: updateInfo.info.package.version,
        previous_version: it.version
      }
      const sql = pgp.helpers.insert(dbData, null, 'machine_updates')
      return db.oneOrNone(sql)
        .then(res => _.map(_.mapKeys(_.camelCase))(res))
    })
}

function getAvailableUpdates () {
  return { info: manifest }
}

module.exports = {
  getMachineName,
  getMachines,
  getUnpairedMachines,
  getMachine,
  getMachineNames,
  setMachine,
  updateNetworkPerformance,
  updateNetworkHeartbeat,
  getNetworkPerformance,
  getNetworkHeartbeat,
  getConfig,
  getUpdateStatuses,
  getMachinesUpdateStatus,
  recordUpdateEvent,
  getAvailableUpdates
}
