const _ = require('lodash/fp')
const uuid = require('uuid')
const db = require('./db')

const getCustomMessages = () => {
  const sql = `SELECT * FROM custom_messages ORDER BY created`
  return db.any(sql).then(res => _.map(
    it => ({
      id: it.id,
      event: _.camelCase(it.event),
      message: it.message
    }), res))
}

const createCustomMessage = (event, message) => {
  const sql = `INSERT INTO custom_messages (id, event, message) VALUES ($1, $2, $3)`
  return db.none(sql, [uuid.v4(), _.snakeCase(event), message])
}

const editCustomMessage = (id, event, message) => {
  const sql = `UPDATE custom_messages SET event=$2, message=$3 WHERE id=$1`
  return db.none(sql, [id, _.snakeCase(event), message])
}

const deleteCustomMessage = id => {
  const sql = `DELETE FROM custom_messages WHERE id=$1`
  return db.none(sql, [id])
}

const getCustomMessage = event => {
  const sql = `SELECT * FROM custom_messages WHERE event=$1 LIMIT 1`
  return db.oneOrNone(sql, [event])
}

module.exports = {
  getCustomMessages,
  createCustomMessage,
  editCustomMessage,
  deleteCustomMessage,
  getCustomMessage
}
