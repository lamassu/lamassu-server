const fsPromises = require('fs').promises
const path = require('path')
const _ = require('lodash/fp')
const pgp = require('pg-promise')()
const uuid = require('uuid')
const makeDir = require('make-dir')

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
const logger = require('./logger')

const fullyFunctionalStatus = { label: 'Fully functional', type: 'success' }
const unresponsiveStatus = { label: 'Unresponsive', type: 'error' }
const stuckStatus = { label: 'Stuck', type: 'error' }
const OPERATOR_DATA_DIR = process.env.OPERATOR_DATA_DIR

const MACHINE_WITH_CALCULATED_FIELD_SQL = `
select d.*, COALESCE(emptybills, 0) + COALESCE(regularbills, 0) as cashbox from devices d
    left join (
      select count(*) as emptyBills, eub.device_id
        from empty_unit_bills eub
        where eub.cashbox_batch_id is null
        group by eub.device_id
      ) as nebills on nebills.device_id = d.device_id
    left join (
      select count(*) as regularBills, cit.device_id from bills b
      left join cash_in_txs cit on b.cash_in_txs_id = cit.id
      where b.cashbox_batch_id is null and b.destination_unit = 'cashbox'
      group by cit.device_id
    ) as nbills on nbills.device_id = d.device_id`

function toMachineObject (r) {
  return {
    deviceId: r.device_id,
    cashUnits: {
      cashbox: r.cashbox,
      cassette1: r.cassette1,
      cassette2: r.cassette2,
      cassette3: r.cassette3,
      cassette4: r.cassette4,
      recycler1: r.recycler1,
      recycler2: r.recycler2,
      recycler3: r.recycler3,
      recycler4: r.recycler4,
      recycler5: r.recycler5,
      recycler6: r.recycler6
    },
    numberOfCassettes: r.number_of_cassettes,
    numberOfRecyclers: r.number_of_recyclers,
    version: r.version,
    model: r.model,
    diagnostics: {
      timestamp: r.diagnostics_timestamp? new Date(r.diagnostics_timestamp) : null,
      scanTimestamp: r.diagnostics_scan_timestamp? new Date(r.diagnostics_scan_timestamp) : null,
      frontTimestamp: r.diagnostics_front_timestamp? new Date(r.diagnostics_front_timestamp) : null
    },
    pairedAt: new Date(r.created),
    lastPing: new Date(r.last_online),
    name: r.name,
    paired: r.paired
    // TODO: we shall start using this JSON field at some point
    // location: r.location,
  }
}

function getMachineIds () {
  const sql = 'select device_id from devices'
  return db.any(sql)
}

function getMachines () {
  const sql = `${MACHINE_WITH_CALCULATED_FIELD_SQL} where display=TRUE ORDER BY created`
  return db.any(sql)
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
  const sql = 'SELECT name FROM devices WHERE device_id=$1'
  return db.oneOrNone(sql, [machineId])
    .then(it => it.name)
}

function getMachine (machineId, config) {
  const sql = `${MACHINE_WITH_CALCULATED_FIELD_SQL} WHERE d.device_id = $1`

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
  const { cassette1, cassette2, cassette3, cassette4, recycler1, recycler2, recycler3, recycler4, recycler5, recycler6 } = rec.cashUnits
  const sql = `UPDATE devices SET cassette1=$1, cassette2=$2, cassette3=$3, cassette4=$4, recycler1=$5, recycler2=$6, recycler3=$7, recycler4=$8, recycler5=$9, recycler6=$10 WHERE device_id=$11;`
  return db.none(sql, [cassette1, cassette2, cassette3, cassette4, recycler1, recycler2, recycler3, recycler4, recycler5, recycler6, rec.deviceId]).then(() => notifierQueries.invalidateNotification(detailB, 'fiatBalance'))
}

function setCassetteBills (rec) {
  const { cashbox, cassette1, cassette2, cassette3, cassette4, recycler1, recycler2, recycler3, recycler4, recycler5, recycler6 } = rec.cashUnits
  return getMachine(rec.deviceId)
    .then(machine => {
      const oldCashboxCount = machine?.cashUnits?.cashbox
      if (_.isNil(oldCashboxCount) || cashbox.toString() === oldCashboxCount.toString()) {
        const sql = `
          UPDATE devices SET cassette1=$1, cassette2=$2, cassette3=$3, cassette4=$4,
            recycler1=coalesce($5, recycler1), recycler2=coalesce($6, recycler2), recycler3=coalesce($7, recycler3),
            recycler4=coalesce($8, recycler4), recycler5=coalesce($9, recycler5), recycler6=coalesce($10, recycler6)
            WHERE device_id=$11`
        return db.none(sql, [cassette1, cassette2, cassette3, cassette4, recycler1, recycler2, recycler3, recycler4, recycler5, recycler6, rec.deviceId])
      }

      return batching.updateMachineWithBatch({ ...rec, oldCashboxValue: oldCashboxCount })
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
            operationName: `cash-${_.replace(/(cassette|recycler)/g, '$1-')(value)}-empty`,
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
            // cash_unit_operation_id: _.find(it => it.operation_type === `cash-${_.replace(/(cassette|recycler)/g, '$1-')(value)}-empty`, operationsToCreate).id
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
        const q3 = t.none(`UPDATE devices SET cassette1=$1, cassette2=$2, cassette3=$3, cassette4=$4, recycler1=$5, recycler2=$6, recycler3=$7, recycler4=$8, recycler5=$9, recycler6=$10 WHERE device_id=$11`, [
          _.defaultTo(machine.cashUnits.cassette1, newUnits.cassette1),
          _.defaultTo(machine.cashUnits.cassette2, newUnits.cassette2),
          _.defaultTo(machine.cashUnits.cassette3, newUnits.cassette3),
          _.defaultTo(machine.cashUnits.cassette4, newUnits.cassette4),
          _.defaultTo(machine.cashUnits.recycler1, newUnits.recycler1),
          _.defaultTo(machine.cashUnits.recycler2, newUnits.recycler2),
          _.defaultTo(machine.cashUnits.recycler3, newUnits.recycler3),
          _.defaultTo(machine.cashUnits.recycler4, newUnits.recycler4),
          _.defaultTo(machine.cashUnits.recycler5, newUnits.recycler5),
          _.defaultTo(machine.cashUnits.recycler6, newUnits.recycler6),
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
            operationName: `cash-${_.replace(/(recycler)/g, '$1-')(value)}-refill`,
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
        const q2 = t.none(`UPDATE devices SET cassette1=$1, cassette2=$2, cassette3=$3, cassette4=$4, recycler1=$5, recycler2=$6, recycler3=$7, recycler4=$8, recycler5=$9, recycler6=$10 WHERE device_id=$11`, [
          _.defaultTo(machine.cashUnits.cassette1, newUnits.cassette1),
          _.defaultTo(machine.cashUnits.cassette2, newUnits.cassette2),
          _.defaultTo(machine.cashUnits.cassette3, newUnits.cassette3),
          _.defaultTo(machine.cashUnits.cassette4, newUnits.cassette4),
          _.defaultTo(machine.cashUnits.recycler1, newUnits.recycler1),
          _.defaultTo(machine.cashUnits.recycler2, newUnits.recycler2),
          _.defaultTo(machine.cashUnits.recycler3, newUnits.recycler3),
          _.defaultTo(machine.cashUnits.recycler4, newUnits.recycler4),
          _.defaultTo(machine.cashUnits.recycler5, newUnits.recycler5),
          _.defaultTo(machine.cashUnits.recycler6, newUnits.recycler6),
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

function diagnostics (rec) {
  const directory = `${OPERATOR_DATA_DIR}/diagnostics/${rec.deviceId}/`
  const sql = `UPDATE devices
            SET diagnostics_timestamp = NULL,
                diagnostics_scan_updated_at = NULL,
                diagnostics_front_updated_at = NULL
            WHERE device_id = $1`

  const scanPath = path.join(directory, 'scan.jpg')
  const frontPath = path.join(directory, 'front.jpg')

  const removeFiles = [scanPath, frontPath].map(filePath => {
    return fsPromises.unlink(filePath).catch(err => {
      if (err.code !== 'ENOENT') {
        throw err
      }
      // File doesn't exist, no problem
    })
  })

  return Promise.all(removeFiles)
    .then(() => db.none(sql, [rec.deviceId]))
    .then(() => db.none('NOTIFY $1:name, $2', ['machineAction', JSON.stringify(
      {
        action: 'diagnostics',
        value: _.pick(['deviceId', 'operatorId', 'action'], rec)
      }
    )]))
}

function setMachine (rec, operatorId) {
  rec.operatorId = operatorId
  switch (rec.action) {
    case 'rename': return renameMachine(rec)
    case 'resetCashOutBills': return resetCashOutBills(rec)
    case 'setCassetteBills': return setCassetteBills(rec)
    case 'unpair': return unpair(rec)
    case 'reboot': return reboot(rec)
    case 'shutdown': return shutdown(rec)
    case 'restartServices': return restartServices(rec)
    case 'emptyUnit': return emptyUnit(rec)
    case 'refillUnit': return refillUnit(rec)
    case 'diagnostics': return diagnostics(rec)
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

function updateDiagnostics (deviceId, images) {
  const sql = `UPDATE devices 
        SET diagnostics_timestamp = NOW(),
            diagnostics_scan_updated_at = CASE WHEN $2 THEN NOW() ELSE diagnostics_scan_updated_at END,
            diagnostics_front_updated_at = CASE WHEN $3 THEN NOW() ELSE diagnostics_front_updated_at END
        WHERE device_id = $1`

  const directory = `${OPERATOR_DATA_DIR}/diagnostics/${deviceId}/`
  const { scan, front } = images

  return updatePhotos(directory, [['scan.jpg', scan], ['front.jpg', front]])
    .then(() => db.none(sql, [deviceId, !!scan, !!front]))
    .catch(err => logger.error('while running machine diagnostics: ', err))
}

const updateFailedQRScans = (deviceId, frames) => {
  const timestamp = (new Date()).toISOString()
  const directory = `${OPERATOR_DATA_DIR}/failedQRScans/${deviceId}/`
  const filenames = _.map(no => `${timestamp}-${no}.jpg`, _.range(0, _.size(frames)))
  return updatePhotos(directory, _.zip(filenames, frames))
}

function createPhoto (name, data, dir) {
  if (!data) {
    logger.error(`Diagnostics error: No data to save for ${name} photo`)
    return Promise.resolve()
  }

  const decodedImageData = Buffer.from(data, 'base64')
  const filename = path.join(dir, name)
  return fsPromises.writeFile(filename, decodedImageData)
}

function updatePhotos (dir, photoPairs) {
  const dirname = path.join(dir)
  _.attempt(() => makeDir.sync(dirname))
  return Promise.all(photoPairs.map(
    ([filename, data]) => createPhoto(filename, data, dirname)
  ))
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
  getMachineIds,
  emptyMachineUnits,
  refillMachineUnits,
  updateDiagnostics,
  updateFailedQRScans
}
