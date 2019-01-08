const fs = require('fs')
const pify = require('pify')
const readFile = pify(fs.readFile)
const db = require('./db')
const options = require('./options')
const logger = require('./logger')
const settingsLoader = require('./settings-loader')

function pullToken (token) {
  const sql = `delete from pairing_tokens
    where token=$1
    returning name, created < now() - interval '1 hour' as expired`
  return db.one(sql, [token])
}

function configureNewDevice (deviceId, machineName, machineModel) {
  const scope = {crypto: 'global', machine: deviceId}
  const newFields = [
    settingsLoader.configAddField(scope, 'cashOutEnabled', 'onOff', null, false),
    settingsLoader.configAddField(scope, 'machineName', 'string', null, machineName),
    settingsLoader.configAddField(scope, 'machineModel', 'string', null, machineModel)
  ]

  return settingsLoader.modifyConfig(newFields)
}

function removeDeviceConfig (deviceId) {
  const scope = {crypto: 'global', machine: deviceId}
  const newFields = [
    settingsLoader.configDeleteField(scope, 'cashOutEnabled'),
    settingsLoader.configDeleteField(scope, 'machineName'),
    settingsLoader.configDeleteField(scope, 'machineModel')
  ]

  return settingsLoader.modifyConfig(newFields)
}

function unpair (deviceId) {
  const sql = 'delete from devices where device_id=$1'
  return db.none(sql, [deviceId])
    .then(() => removeDeviceConfig(deviceId))
}

function pair (token, deviceId, machineModel) {
  return pullToken(token)
    .then(r => {
      if (r.expired) return false

      const insertSql = `insert into devices (device_id, name) values ($1, $2)
    on conflict (device_id)
    do update set paired=TRUE, display=TRUE`

      return configureNewDevice(deviceId, r.name, machineModel)
        .then(() => db.none(insertSql, [deviceId, r.name]))
        .then(() => true)
    })
    .catch(err => {
      logger.debug(err)
      return false
    })
}

function authorizeCaDownload (caToken) {
  return pullToken(caToken)
    .then(r => {
      if (r.expired) throw new Error('Expired')

      const caPath = options.caPath
      return readFile(caPath, {encoding: 'utf8'})
    })
}

function isPaired (deviceId) {
  const sql = 'select device_id, name from devices where device_id=$1 and paired=TRUE'

  return db.oneOrNone(sql, [deviceId])
    .then(row => row && row.device_id === deviceId ? row.name : false)
}

module.exports = {pair, unpair, authorizeCaDownload, isPaired}
