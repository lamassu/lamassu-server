const _ = require('lodash/fp')
const uuid = require('uuid')
const db = require('./db')

const getSMSNotices = () => {
  const sql = `SELECT * FROM sms_notices ORDER BY created`
  return db.any(sql).then(res => _.map(
    it => ({
      id: it.id,
      event: _.camelCase(it.event),
      message: it.message,
      messageName: it.message_name,
      enabled: it.enabled,
      allowToggle: it.allow_toggle
    }), res))
}

const createSMSNotice = (event, messageName, message, enabled, allowToggle) => {
  const sql = `INSERT INTO sms_notices (id, event, message_name, message, enabled, allow_toggle) VALUES ($1, $2, $3, $4, $5, $6)`
  return db.none(sql, [uuid.v4(), _.snakeCase(event), messageName, message, enabled, allowToggle])
}

const editSMSNotice = (id, event, message) => {
  const sql = `UPDATE sms_notices SET event=$2, message=$3 WHERE id=$1`
  return db.none(sql, [id, _.snakeCase(event), message])
}

const deleteSMSNotice = id => {
  const sql = `DELETE FROM sms_notices WHERE id=$1`
  return db.none(sql, [id])
}

const getSMSNotice = event => {
  const sql = `SELECT * FROM sms_notices WHERE event=$1 LIMIT 1`
  return db.oneOrNone(sql, [event])
}

const enableSMSNotice = id => {
  const sql = `UPDATE sms_notices SET enabled = true WHERE id=$1`
  return db.oneOrNone(sql, [id])
}

const disableSMSNotice = id => {
  const sql = `UPDATE sms_notices SET enabled = false WHERE id=$1`
  return db.oneOrNone(sql, [id])
}

module.exports = {
  getSMSNotices,
  createSMSNotice,
  editSMSNotice,
  deleteSMSNotice,
  getSMSNotice,
  enableSMSNotice,
  disableSMSNotice
}
