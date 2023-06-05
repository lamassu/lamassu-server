const _ = require('lodash/fp')

const db = require('./db')
const camelize = require('./utils')

const getMachineConfigs = () => {
  const sql = 'SELECT * FROM device_configuration'

  // Don't deep camelize to maintain the uppercasing in some of the device_config keys. For example, "mockCryptoQR"
  return db.any(sql).then(_.map(camelize(false)))
}

const getMachineConfig = machineId => {
  const sql = 'SELECT device_config, last_modified FROM device_configuration WHERE device_id = $1'

  // Don't deep camelize to maintain the uppercasing in some of the device_config keys. For example, "mockCryptoQR"
  return db.oneOrNone(sql, machineId).then(camelize(false))
}

const storeMachineConfig = (machineId, deviceConfig) => {
  const sql = 'INSERT INTO device_configuration (device_id, device_config, last_modified) VALUES ($1, $2, now()) RETURNING *'

  // Don't deep camelize to maintain the uppercasing in some of the device_config keys. For example, "mockCryptoQR"
  return db.one(sql, [machineId, deviceConfig]).then(camelize(false))
}

const updateMachineConfig = (machineId, newDeviceConfig) => {
  const sql = 'UPDATE device_configuration SET device_config = $1 WHERE device_id = $2 RETURNING *'

  // Don't deep camelize to maintain the uppercasing in some of the device_config keys. For example, "mockCryptoQR"
  return db.one(sql, [newDeviceConfig, machineId]).then(camelize(false))
}

module.exports = {
  getMachineConfigs,
  getMachineConfig,
  storeMachineConfig,
  updateMachineConfig
}
