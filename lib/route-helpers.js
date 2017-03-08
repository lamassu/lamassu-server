const _ = require('lodash/fp')
const R = require('ramda')

const db = require('./db')
const dbm = require('./postgresql_interface')
const T = require('./time')
const BN = require('./bn')

const TRANSACTION_EXPIRATION = 2 * T.days

function httpError (msg, code) {
  const err = new Error(msg)
  err.name = 'HTTPError'
  err.code = code || 500

  return err
}

function stateChange (deviceId, deviceTime, rec) {
  const event = {
    id: rec.uuid,
    deviceId: deviceId,
    eventType: 'stateChange',
    note: JSON.stringify({state: rec.state, isIdle: rec.isIdle, txId: rec.txId}),
    deviceTime: deviceTime
  }
  return dbm.machineEvent(event)
}

function toObj (row) {
  if (!row) return null

  const keys = _.keys(row)
  let newObj = {}

  keys.forEach(key => {
    const objKey = _.camelCase(key)
    if (key === 'crypto_atoms' || key === 'fiat') {
      newObj[objKey] = BN(row[key])
      return
    }

    newObj[objKey] = row[key]
  })

  return newObj
}

function fetchPhoneTx (phone) {
  const sql = `select * from cash_out_txs
    where phone=$1 and dispensed=$2
    and (extract(epoch from (coalesce(confirmation_time, now()) - created))) * 1000 < $3`

  const values = [phone, false, TRANSACTION_EXPIRATION]

  return db.any(sql, values)
  .then(_.map(toObj))
  .then(txs => {
    const confirmedTxs = txs.filter(tx => R.contains(tx.status, ['instant', 'confirmed']))
    if (confirmedTxs.length > 0) {
      const maxTx = R.reduce((acc, val) => {
        return !acc || val.cryptoAtoms.gt(acc.cryptoAtoms) ? val : acc
      }, null, confirmedTxs)

      return maxTx
    }

    if (txs.length > 0) throw httpError('Pending transactions', 412)
    throw httpError('No transactions', 404)
  })
}

function fetchStatusTx (txId, status) {
  const sql = 'select * from cash_out_txs where id=$1'

  return db.oneOrNone(sql, [txId, status])
  .then(toObj)
  .then(tx => {
    if (!tx) throw httpError('No transaction', 404)
    if (tx.status === status) throw httpError('Not Modified', 304)
    return tx
  })
}

function updateDeviceConfigVersion (versionId) {
  return db.none('update devices set user_config_id=$1', [versionId])
}

module.exports = {stateChange, fetchPhoneTx, fetchStatusTx, updateDeviceConfigVersion}
