const { v4: uuidv4 } = require('uuid')
const pgp = require('pg-promise')()
const _ = require('lodash/fp')

const dbm = require('../postgresql_interface')
const db = require('../db')

// types of notifications able to be inserted into db:
/*
highValueTransaction - for transactions of value higher than threshold
fiatBalance - when the number of notes in cash cassettes falls below threshold
cryptoBalance - when ammount of crypto balance in fiat falls below or above low/high threshold
compliance - notifications related to warnings triggered by compliance settings
error - notifications related to errors
*/

function getMachineName (machineId) {
  const sql = 'SELECT * FROM devices WHERE device_id=$1'
  return db.oneOrNone(sql, [machineId])
    .then(it => it.name)
}

const addNotification = (type, message, detail) => {
  const sql = `INSERT INTO notifications (id, type, message, detail) VALUES ($1, $2, $3, $4)`
  return db.oneOrNone(sql, [uuidv4(), type, message, detail])
}

const getAllValidNotifications = (type) => {
  const sql = `SELECT * FROM notifications WHERE type = $1 AND valid = 't'`
  return db.any(sql, [type])
}

const invalidateNotification = (detail, type) => {
  detail = _.omitBy(_.isEmpty, detail)
  const sql = `UPDATE notifications SET valid = 'f', read = 't' WHERE valid = 't' AND type = $1 AND detail::jsonb @> $2::jsonb`
  return db.none(sql, [type, detail])
}

const batchInvalidate = (ids) => {
  const formattedIds = _.map(pgp.as.text, ids).join(',')
  const sql = `UPDATE notifications SET valid = 'f', read = 't' WHERE id IN ($1^)`
  return db.none(sql, [formattedIds])
}

const clearBlacklistNotification = (cryptoCode, cryptoAddress) => {
  const sql = `UPDATE notifications SET valid = 'f', read = 't' WHERE type = 'compliance' AND detail->>'cryptoCode' = $1 AND detail->>'cryptoAddress' = $2 AND (detail->>'code' = 'BLOCKED' OR detail->>'code' = 'REUSED')`
  return db.none(sql, [cryptoCode, cryptoAddress])
}

const getValidNotifications = (type, detail) => {
  const sql = `SELECT * FROM notifications WHERE type = $1 AND valid = 't' AND detail @> $2`
  return db.any(sql, [type, detail])
}

const getNotifications = () => {
  const sql = `SELECT * FROM notifications ORDER BY created DESC`
  return db.any(sql)
}

const markAsRead = (id) => {
  const sql = `UPDATE notifications SET read = 't' WHERE id = $1`
  return db.none(sql, [id])
}

const markAllAsRead = () => {
  const sql = `UPDATE notifications SET read = 't'`
  return db.none(sql)
}

const hasUnreadNotifications = () => {
  const sql = `SELECT EXISTS (SELECT 1 FROM notifications WHERE read = 'f' LIMIT 1)`
  return db.oneOrNone(sql).then(res => res.exists)
}

const getAlerts = () => {
  const types = ['fiatBalance', 'cryptoBalance', 'error']
  const sql = `SELECT * FROM notifications WHERE valid = 't' AND type IN ($1:list) ORDER BY created DESC`
  return db.any(sql, [types])
}

module.exports = {
  machineEvents: dbm.machineEvents,
  addNotification,
  getAllValidNotifications,
  invalidateNotification,
  batchInvalidate,
  clearBlacklistNotification,
  getValidNotifications,
  getNotifications,
  markAsRead,
  markAllAsRead,
  hasUnreadNotifications,
  getAlerts,
  getMachineName
}
