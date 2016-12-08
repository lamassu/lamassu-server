const R = require('ramda')

const db = require('./db')
const dbm = require('./postgresql_interface')
const T = require('./time')
const TRANSACTION_EXPIRATION = 2 * T.days

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

function fetchPhoneTx (phone) {
  return dbm.fetchPhoneTxs(phone, TRANSACTION_EXPIRATION)
  .then(txs => {
    const confirmedTxs = txs.filter(tx => R.contains(tx.status, ['instant', 'confirmed']))
    if (confirmedTxs.length > 0) {
      const maxTx = R.reduce((acc, val) => {
        return !acc || val.cryptoAtoms.gt(acc.cryptoAtoms) ? val : acc
      }, null, confirmedTxs)

      return {tx: maxTx}
    }

    if (txs.length > 0) return {pending: true}
    return {}
  })
}

function updateDeviceConfigVersion (versionId) {
  return db.none('update devices set user_config_id=$1', [versionId])
}

module.exports = {stateChange, fetchPhoneTx, updateDeviceConfigVersion}
