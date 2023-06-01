const _ = require('lodash/fp')

const db = require('./db')
const camelize = require('./utils')

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

module.exports = {
  getMachineConfig,
  storeMachineConfig
}
