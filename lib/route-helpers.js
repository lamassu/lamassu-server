const _ = require('lodash/fp')

const db = require('./db')
const dbm = require('./postgresql_interface')
const T = require('./time')
const BN = require('./bn')
const settingsLoader = require('./settings-loader')

const TRANSACTION_EXPIRATION = T.day

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

function toCashOutTx (row) {
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

  return _.set('direction', 'cashOut', newObj)
}

function fetchPhoneTx (phone) {
  const sql = `select * from cash_out_txs
    where phone=$1 and dispense=$2
    and (extract(epoch from (now() - created))) * 1000 < $3`

  const values = [phone, false, TRANSACTION_EXPIRATION]

  return db.any(sql, values)
    .then(_.map(toCashOutTx))
    .then(txs => {
      const confirmedTxs = txs.filter(tx => _.includes(tx.status, ['instant', 'confirmed']))
      if (confirmedTxs.length > 0) {
        const reducer = (acc, val) => {
          return !acc || val.cryptoAtoms.gt(acc.cryptoAtoms) ? val : acc
        }

        const maxTx = _.reduce(reducer, null, confirmedTxs)

        return maxTx
      }

      if (txs.length > 0) throw httpError('Pending transactions', 412)
      throw httpError('No transactions', 404)
    })
}

function fetchStatusTx (txId, status) {
  const sql = 'select * from cash_out_txs where id=$1'

  return db.oneOrNone(sql, [txId])
    .then(toCashOutTx)
    .then(tx => {
      if (!tx) throw httpError('No transaction', 404)
      if (tx.status === status) throw httpError('Not Modified', 304)
      return tx
    })
}

function updateDeviceConfigVersion (versionId) {
  return db.none('update devices set user_config_id=$1', [versionId])
}

function updateMachineDefaults (deviceId) {
  const newFields = [{
    fieldLocator: {
      fieldScope: {
        crypto: 'global',
        machine: deviceId
      },
      code: 'cashOutEnabled',
      fieldType: 'onOff',
      fieldClass: null
    },
    fieldValue: {
      fieldType: 'onOff',
      value: false
    }
  }]

  return settingsLoader.loadLatest()
    .then(settings => {
      return settingsLoader.save(settingsLoader.mergeValues(settings.config, newFields))
    })
}

module.exports = {
  stateChange,
  fetchPhoneTx,
  fetchStatusTx,
  updateDeviceConfigVersion,
  updateMachineDefaults
}
