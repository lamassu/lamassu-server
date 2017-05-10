const _ = require('lodash/fp')

const db = require('./db')
const pairing = require('./pairing')
const configManager = require('./config-manager')
const settingsLoader = require('./settings-loader')

module.exports = {getMachines, getMachineNames, setMachine}

function getMachines () {
  return db.any('select * from devices where display=TRUE order by created')
  .then(rr => rr.map(r => ({
    deviceId: r.device_id,
    cashbox: r.cashbox,
    cassette1: r.cassette1,
    cassette2: r.cassette2,
    paired: r.paired
  })))
}

function getConfig (defaultConfig) {
  if (defaultConfig) return Promise.resolve(defaultConfig)

  return settingsLoader.loadRecentConfig()
}

function getMachineNames (config) {
  return Promise.all([getMachines(), getConfig(config)])
  .then(([machines, config]) => {
    const addName = r => {
      const name = configManager.machineScoped(r.deviceId, config).machineName
      return _.set('name', name, r)
    }

    return _.map(addName, machines)
  })
}

function resetCashOutBills (rec) {
  const sql = 'update devices set cassette1=$1, cassette2=$2 where device_id=$3'
  return db.none(sql, [rec.cassettes[0], rec.cassettes[1], rec.deviceId])
}

function unpair (rec) {
  return pairing.unpair(rec.deviceId)
}

function setMachine (rec) {
  switch (rec.action) {
    case 'resetCashOutBills': return resetCashOutBills(rec)
    case 'unpair': return unpair(rec)
    default: throw new Error('No such action: ' + rec.action)
  }
}
