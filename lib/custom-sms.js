const uuid = require('uuid')
const db = require('./db')

const getCustomMessages = () => {
  const sql = `SELECT * FROM custom_messages`
  return db.any(sql)
}

const createCustomMessage = (event, deviceId, message) => {
  const sql = `INSERT INTO custom_message (event, device_id, message) VALUES ($2, $3, $4)`
  return db.none(sql, [uuid.v4(), event, deviceId, message])
}

module.exports = {
  getCustomMessages,
  createCustomMessage
}
