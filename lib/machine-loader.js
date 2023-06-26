const _ = require('lodash/fp')
const pgp = require('pg-promise')()
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
const { ApolloError } = require('apollo-server-errors');
const { loadLatestConfig } = require('./new-settings-loader')

const fullyFunctionalStatus = { label: 'Fully functional', type: 'success' }
const unresponsiveStatus = { label: 'Unresponsive', type: 'error' }
const stuckStatus = { label: 'Stuck', type: 'error' }

function toMachineObject (r) {
  return {
    deviceId: r.device_id,
    cashUnits: {
      cashbox: r.cashbox,
      cassette1: r.cassette1,
      cassette2: r.cassette2,
      cassette3: r.cassette3,
      cassette4: r.cassette4,
      stacker1f: r.stacker1f,
      stacker1r: r.stacker1r,
      stacker2f: r.stacker2f,
      stacker2r: r.stacker2r,
      stacker3f: r.stacker3f,
      stacker3r: r.stacker3r
    },
    numberOfCassettes: r.number_of_cassettes,
    numberOfStackers: r.number_of_stackers,
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
  const { cassette1, cassette2, cassette3, cassette4, stacker1f, stacker1r, stacker2f, stacker2r, stacker3f, stacker3r } = rec.cashUnits
  const sql = `UPDATE devices SET cassette1=$1, cassette2=$2, cassette3=$3, cassette4=$4, stacker1f=$5, stacker1r=$6, stacker2f=$7, stacker2r=$8, stacker3f=$9, stacker3r=$10 WHERE device_id=$11;`
  return db.none(sql, [cassette1, cassette2, cassette3, cassette4, stacker1f, stacker1r, stacker2f, stacker2r, stacker3f, stacker3r, rec.deviceId]).then(() => notifierQueries.invalidateNotification(detailB, 'fiatBalance'))
}

function emptyCashInBills (rec) {
  const sql = 'UPDATE devices SET cashbox=0 WHERE device_id=$1'
  return db.none(sql, [rec.deviceId])
}

function setCassetteBills (rec) {
  const { cashbox, cassette1, cassette2, cassette3, cassette4, stacker1f, stacker1r, stacker2f, stacker2r, stacker3f, stacker3r } = rec.cashUnits
  return db.oneOrNone(`SELECT cashbox FROM devices WHERE device_id=$1 LIMIT 1`, [rec.deviceId])
    .then(oldCashboxValue => {
      if (_.isNil(oldCashboxValue) || cashbox === oldCashboxValue.cashbox) {
        const sql = 'UPDATE devices SET cashbox=$1, cassette1=$2, cassette2=$3, cassette3=$4, cassette4=$5, stacker1f=$6, stacker1r=$7, stacker2f=$8, stacker2r=$9, stacker3f=$10, stacker3r=$11 WHERE device_id=$12'
        return db.none(sql, [cashbox, cassette1, cassette2, cassette3, cassette4, stacker1f, stacker1r, stacker2f, stacker2r, stacker3f, stacker3r, rec.deviceId])
      }

      return batching.updateMachineWithBatch({ ...rec, oldCashboxValue })
    })
}

function emptyMachineUnits ({ deviceId, newUnits, fiatCode }) {
  return loadLatestConfig()
    .then(config => Promise.all([getMachine(deviceId), configManager.getCashOut(deviceId, config)]))
    .then(([machine, cashoutSettings]) => {
      const movedBills = _.reduce(
        (acc, value) => ({
          ...acc,
          [value]: {
            operationName: `cash-${_.replace(/(cassette|stacker)/g, '$1-')(value)}-empty`,
            delta: newUnits[value] - machine.cashUnits[value],
            denomination: value !== 'cashbox' ? cashoutSettings[value] : null
          }
        }),
        {},
        _.keys(newUnits)
      )

      const operationNames = _.mapValues(it => it.operationName)(_.filter(it => Math.abs(it.delta) > 0)(_.omit(['cashbox'], movedBills)))
      const operationsToCreate = _.map(it => ({
        id: uuid.v4(),
        device_id: deviceId,
        operation_type: it
      }))(operationNames)

      const billArr = _.reduce(
        (acc, value) => {
          const unit = movedBills[value]
          return _.concat(acc, _.times(() => ({
            id: uuid.v4(),
            fiat: unit.denomination,
            fiat_code: fiatCode,
            device_id: deviceId
            // TODO: Uncomment this if we decide to keep track of bills across multiple operations. For now, we'll just create the emptying operations for each unit affected, but not relate these events with individual bills and just use the field for the cashbox batch event
            // cash_unit_operation_id: _.find(it => it.operation_type === `cash-${_.replace(/(cassette|stacker)/g, '$1-')(value)}-empty`, operationsToCreate).id
          }), Math.abs(unit.delta)))
        },
        [],
        _.keys(_.omit(['cashbox'], movedBills))
      )

      // This occurs when an empty unit is called when the units are already empty, hence, no bills moved around
      if (_.isEmpty(billArr) && _.isEmpty(operationsToCreate)) {
        return Promise.resolve()
      }

      return db.tx(t => {
        const q1Cols = ['id', 'device_id', 'operation_type']
        const q1= t.none(pgp.helpers.insert(operationsToCreate, q1Cols, 'cash_unit_operation'))
        const q2Cols = ['id', 'fiat', 'fiat_code', 'device_id']
        const q2 = t.none(pgp.helpers.insert(billArr, q2Cols, 'empty_unit_bills'))
        const q3 = t.none(`UPDATE devices SET cashbox=$1, cassette1=$2, cassette2=$3, cassette3=$4, cassette4=$5, stacker1f=$6, stacker1r=$7, stacker2f=$8, stacker2r=$9, stacker3f=$10, stacker3r=$11 WHERE device_id=$12`, [
          _.defaultTo(machine.cashUnits.cashbox, newUnits.cashbox),
          _.defaultTo(machine.cashUnits.cassette1, newUnits.cassette1),
          _.defaultTo(machine.cashUnits.cassette2, newUnits.cassette2),
          _.defaultTo(machine.cashUnits.cassette3, newUnits.cassette3),
          _.defaultTo(machine.cashUnits.cassette4, newUnits.cassette4),
          _.defaultTo(machine.cashUnits.stacker1f, newUnits.stacker1f),
          _.defaultTo(machine.cashUnits.stacker1r, newUnits.stacker1r),
          _.defaultTo(machine.cashUnits.stacker2f, newUnits.stacker2f),
          _.defaultTo(machine.cashUnits.stacker2r, newUnits.stacker2r),
          _.defaultTo(machine.cashUnits.stacker3f, newUnits.stacker3f),
          _.defaultTo(machine.cashUnits.stacker3r, newUnits.stacker3r),
          deviceId
        ])

        return t.batch([q1, q2, q3])
      })
    })
}

function refillMachineUnits ({ deviceId, newUnits }) {
  return getMachine(deviceId)
    .then(machine => {
      const movedBills = _.reduce(
        (acc, value) => ({
          ...acc,
          [value]: {
            operationName: `cash-${_.replace(/(stacker)/g, '$1-')(value)}-refill`,
            delta: newUnits[value] - machine.cashUnits[value]
          }
        }),
        {},
        _.keys(newUnits)
      )

      const operationNames = _.mapValues(it => it.operationName)(_.filter(it => Math.abs(it.delta) > 0)(_.omit(['cassette1', 'cassette2', 'cassette3', 'cassette4'], movedBills)))
      const operationsToCreate = _.map(it => ({
        id: uuid.v4(),
        device_id: deviceId,
        operation_type: it
      }))(operationNames)

      // This occurs when a refill unit is called when the loading boxes are empty, hence, no bills moved around
      if (_.isEmpty(operationsToCreate)) {
        return Promise.resolve()
      }

      return db.tx(t => {
        const q1Cols = ['id', 'device_id', 'operation_type']
        const q1= t.none(pgp.helpers.insert(operationsToCreate, q1Cols, 'cash_unit_operation'))
        const q2 = t.none(`UPDATE devices SET cashbox=$1, cassette1=$2, cassette2=$3, cassette3=$4, cassette4=$5, stacker1f=$6, stacker1r=$7, stacker2f=$8, stacker2r=$9, stacker3f=$10, stacker3r=$11 WHERE device_id=$12`, [
          _.defaultTo(machine.cashUnits.cashbox, newUnits.cashbox),
          _.defaultTo(machine.cashUnits.cassette1, newUnits.cassette1),
          _.defaultTo(machine.cashUnits.cassette2, newUnits.cassette2),
          _.defaultTo(machine.cashUnits.cassette3, newUnits.cassette3),
          _.defaultTo(machine.cashUnits.cassette4, newUnits.cassette4),
          _.defaultTo(machine.cashUnits.stacker1f, newUnits.stacker1f),
          _.defaultTo(machine.cashUnits.stacker1r, newUnits.stacker1r),
          _.defaultTo(machine.cashUnits.stacker2f, newUnits.stacker2f),
          _.defaultTo(machine.cashUnits.stacker2r, newUnits.stacker2r),
          _.defaultTo(machine.cashUnits.stacker3f, newUnits.stacker3f),
          _.defaultTo(machine.cashUnits.stacker3r, newUnits.stacker3r),
          deviceId
        ])
  
        return t.batch([q1, q2])
      })
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

function emptyUnit (rec) {
  return db.none('NOTIFY $1:name, $2', ['machineAction', JSON.stringify(
    { 
      action: 'emptyUnit',
      value: _.pick(['deviceId', 'operatorId', 'action'], rec)
    }
  )])
}

function refillUnit (rec) {
  return db.none('NOTIFY $1:name, $2', ['machineAction', JSON.stringify(
    { 
      action: 'refillUnit',
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
    case 'emptyUnit': return emptyUnit(rec)
    case 'refillUnit': return refillUnit(rec)
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
  emptyMachineUnits,
  refillMachineUnits
}
