const _ = require('lodash/fp')
const axios = require('axios')

const db = require('./db')
const pairing = require('./pairing')
const { checkPings, checkStuckScreen } = require('./notifier')
const dbm = require('./postgresql_interface')
const configManager = require('./new-config-manager')
const settingsLoader = require('./new-settings-loader')
const notifierUtils = require('./notifier/utils')
const notifierQueries = require('./notifier/queries')

const fullyFunctionalStatus = { label: 'Fully functional', type: 'success' }
const unresponsiveStatus = { label: 'Unresponsive', type: 'error' }
const stuckStatus = { label: 'Stuck', type: 'error' }

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
        _.first(checkStuckScreen(events, machine.name))
        )
      ]
      
    return _.assign(machine, { cashOut, statuses })
  }
}

function getMachineNames (config) {
  return Promise.all([getMachines(), getConfig(config)])
    .then(([machines, config]) => Promise.all(
      [machines, checkPings(machines), dbm.machineEvents(), config]
    ))
    .then(([machines, pings, events, config]) => {
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
  const queryMachine = db.oneOrNone(sql, [machineId]).then(r => ({
    deviceId: r.device_id,
    cashbox: r.cashbox,
    cassette1: r.cassette1,
    cassette2: r.cassette2,
    version: r.version,
    model: r.model,
    pairedAt: new Date(r.created),
    lastPing: new Date(r.last_online),
    name: r.name,
    paired: r.paired
  }))

  return Promise.all([queryMachine, dbm.machineEvents(), config])
      .then(([machine, events, config]) => {
        const pings = checkPings([machine])
        
      return [machine].map(addName(pings, events, config))[0]
    })
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
  return axios.post(`http://localhost:3030/reboot?device_id=${rec.deviceId}`)
}

function shutdown (rec) {
  return axios.post(`http://localhost:3030/shutdown?device_id=${rec.deviceId}`)
}

function restartServices (rec) {
  return axios.post(`http://localhost:3030/restartServices?device_id=${rec.deviceId}`)
}

function setMachine (rec) {
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

module.exports = { getMachineName, getMachines, getMachine, getMachineNames, setMachine }
