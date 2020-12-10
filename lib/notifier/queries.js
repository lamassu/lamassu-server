const dbm = require('../postgresql_interface')
const db = require('../db')
const { v4: uuidv4 } = require('uuid')

// types of notifications able to be inserted into db:
/*
highValueTransaction - for transactions of value higher than threshold
fiatBalance - when the number of notes in cash cassettes falls below threshold
cryptoBalance - when ammount of crypto balance in fiat falls below or above low/high threshold
compliance - notifications related to warnings triggered by compliance settings
error - notifications related to errors
*/

const addHighValueTx = (tx) => {
    const sql = `INSERT INTO notifications (id, type, device_id, message, created) values ($1, $2, $3, $4, CURRENT_TIMESTAMP)`
    const direction = tx.direction === "cashOut" ? 'cash-out' : 'cash-in'
    const message = `${tx.fiat} ${tx.fiatCode} ${direction} transaction`
    return db.oneOrNone(sql, [uuidv4(), 'highValueTransaction', tx.deviceId, message])
}

const addCashCassetteWarning = (cassetteNumber, deviceId) => {
    const sql = `INSERT INTO notifications (id, type, detail, device_id, message, created) values ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`
    const message = `Cash-out cassette ${cassetteNumber} almost empty!`
    return db.oneOrNone(sql, [uuidv4(), 'fiatBalance', cassetteNumber, deviceId, message])
}

const getUnreadCassetteNotifications = (cassetteNumber, deviceId) => {
    const sql = `SELECT * FROM notifications WHERE read = 'f' AND device_id = $1 AND TYPE = 'fiatBalance' AND detail = '$2'`
    return db.any(sql, [deviceId, cassetteNumber])
}

const addCryptoBalanceWarning = (detail, message) => {
    const sql = `INSERT INTO notifications (id, type, detail, message, created) values ($1, $2, $3, $4, CURRENT_TIMESTAMP)`
    return db.oneOrNone(sql, [uuidv4(), 'cryptoBalance', detail, message])
}

const getAllValidNotifications = (type) => {
    const sql = `SELECT * FROM notifications WHERE type = $1 AND valid = 't'`
    return db.any(sql, [type])
}

const addErrorNotification = (detail, message, deviceId) => {
    const sql = `INSERT INTO notifications (id, type, detail, device_id, message, created) values ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`
    return db.oneOrNone(sql, [uuidv4(), 'error', detail, deviceId, message])
}

const getValidNotifications = (type, detail, deviceId = null) => {
    let sql;
    if(!deviceId) {
        sql = `SELECT * FROM notifications WHERE type = $1 AND valid = 't' AND detail LIKE $2`
    }
    else {
        sql = `SELECT * FROM notifications WHERE type = $1 AND valid = 't' AND detail LIKE $2 AND device_id = $3`
    }
    return db.any(sql, [type, `%${detail}%`, deviceId])
}

const invalidateNotification = (id) => {
    const sql = `UPDATE notifications SET valid = 'f', read = 't' WHERE id = $1`
    return db.none(sql, [id])
}

module.exports = {
    machineEvents: dbm.machineEvents,
    addHighValueTx,
    addCashCassetteWarning,
    addCryptoBalanceWarning,
    addErrorNotification,
    getUnreadCassetteNotifications,
    getAllValidNotifications,
    getValidNotifications,
    invalidateNotification,
}
