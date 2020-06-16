const _ = require('lodash/fp')
const axios = require('axios')

const logger = require('./logger')
const db = require('./db')
const pairing = require('./pairing')
const configManager = require('./new-config-manager')
const settingsLoader = require('./new-settings-loader')

module.exports = {getMachineName, getMachines, getMachineNames, setMachine}

function getMachines () {
  return db.any('select * from devices where display=TRUE order by created')
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
  return Promise.all([getMachines(), getConfig(config)])
    .then(([machines, config]) => {
      const addName = r => {
        const cashOutConfig = configManager.getCashOut(r.deviceId, config)

        const cashOut = !!cashOutConfig.active

        // TODO new-admin actually load status based on ping. 
        const statuses = [{label: 'Unknown detailed status', type: 'warning'}]

        return _.assign(r, {cashOut, statuses})
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
  const sql = 'select * from devices where device_id=$1'
  return db.oneOrNone(sql, [machineId])
    .then(it => it.name)
}

function resetCashOutBills (rec) {
  const sql = 'update devices set cassette1=$1, cassette2=$2 where device_id=$3'
  return db.none(sql, [rec.cassettes[0], rec.cassettes[1], rec.deviceId])
}

function emptyCashInBills (rec) {
  const sql = 'update devices set cashbox=0 where device_id=$1'
  return db.none(sql, [rec.deviceId])
}

function unpair (rec) {
  return pairing.unpair(rec.deviceId)
}

function reboot (rec) {
  return axios.post(`http://localhost:3030/reboot?device_id=${rec.deviceId}`)
}

function restartServices (rec) {
  return axios.post(`http://localhost:3030/restartServices?device_id=${rec.deviceId}`)
}

function setMachine (rec) {
  switch (rec.action) {
    case 'emptyCashInBills': return emptyCashInBills(rec)
    case 'resetCashOutBills': return resetCashOutBills(rec)
    case 'unpair': return unpair(rec)
    case 'reboot': return reboot(rec)
    case 'restartServices': return restartServices(rec)
    default: throw new Error('No such action: ' + rec.action)
  }
}
