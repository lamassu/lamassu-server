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
    const sql = `INSERT INTO notifications (id, type, device_id, message, created) values($1, $2, $3, $4, CURRENT_TIMESTAMP)`
    const direction = tx.direction === "cashOut" ? 'cash-out' : 'cash-in'
    const message = `${tx.fiat} ${tx.fiatCode} ${direction} transaction`
    return db.oneOrNone(sql, [uuidv4(), 'highValueTransaction', tx.deviceId, message])
}

const addCashCassetteWarning = (cassetteNumber, deviceId) => {
    const sql = `INSERT INTO notifications (id, type, detail, device_id, message, created) values($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`
    const message = `Cash-out cassette ${cassetteNumber} almost empty!`
    return db.oneOrNone(sql, [uuidv4(), 'fiatBalance', cassetteNumber, deviceId, message])
}

const getUnreadCassetteNotifications = (cassetteNumber) => {
    const sql = `SELECT * FROM notifications WHERE read = 'f' AND TYPE = 'fiatBalance' AND detail = '$1'`
    return db.any(sql, [cassetteNumber])
}

module.exports = { machineEvents: dbm.machineEvents, addHighValueTx, addCashCassetteWarning, getUnreadCassetteNotifications }
