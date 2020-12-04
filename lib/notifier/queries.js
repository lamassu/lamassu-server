const dbm = require('../postgresql_interface')
const db = require('../db')
const { v4: uuidv4 } = require('uuid')

const addHighValueTx = (tx) => {
    const sql = `INSERT INTO notifications (id, type, device_id, message, created) values($1, $2, $3, $4, CURRENT_TIMESTAMP)`
    const direction = tx.direction === "cashOut" ? 'cash-out' : 'cash-in'
    const message = `${tx.fiat} ${tx.fiatCode} ${direction} transaction`
    return db.oneOrNone(sql, [uuidv4(), 'highValueTransaction', tx.deviceId, message])
}

module.exports = { machineEvents: dbm.machineEvents, addHighValueTx }
