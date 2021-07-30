const _ = require('lodash/fp')
const uuid = require('uuid')
const db = require('./db')

const getCustomMessages = () => {
  const sql = `SELECT * FROM custom_messages ORDER BY created`
  return db.any(sql).then(res => _.map(
    it => ({
      id: it.id,
      event: _.camelCase(it.event),
      deviceId: it.device_id,
      message: it.message
    }), res))
}

const createCustomMessage = (event, deviceId, message) => {
  const machineId = deviceId === 'ALL_MACHINES' ? null : deviceId
  const sql = `INSERT INTO custom_messages (id, event, device_id, message) VALUES ($1, $2, $3, $4)`
  return db.none(sql, [uuid.v4(), _.snakeCase(event), machineId, message])
}

const editCustomMessage = (id, event, deviceId, message) => {
  const machineId = deviceId === 'ALL_MACHINES' ? null : deviceId
  const sql = `UPDATE custom_messages SET event=$2, device_id=$3, message=$4 WHERE id=$1`
  return db.none(sql, [id, _.snakeCase(event), machineId, message])
}

const deleteCustomMessage = id => {
  const sql = `DELETE FROM custom_messages WHERE id=$1`
  return db.none(sql, [id])
}

const getCommonCustomMessages = event => {
  const sql = `SELECT * FROM custom_messages WHERE event=$1 AND device_id IS NULL LIMIT 1`
  return db.oneOrNone(sql, [event])
}

const getMachineCustomMessages = (event, deviceId) => {
  const sql = `SELECT * FROM custom_messages WHERE event=$1 AND device_id=$2 LIMIT 1`
  return db.oneOrNone(sql, [event, deviceId])
}

module.exports = {
  getCustomMessages,
  createCustomMessage,
  editCustomMessage,
  deleteCustomMessage,
  getCommonCustomMessages,
  getMachineCustomMessages
}
