const _ = require('lodash/fp')

const db = require('./db')
const T = require('./time')
const BN = require('./bn')

const REDEEMABLE_AGE = T.day

module.exports = {redeemableTxs, toObj}

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

  newObj.direction = 'cashOut'

  return newObj
}

function redeemableTxs (deviceId) {
  const sql = `select * from cash_out_txs
  where device_id=$1
  and redeem=$2
  and dispense_confirmed=$3
  and (extract(epoch from (now() - greatest(created, confirmation_time))) * 1000) < $4`

  return db.any(sql, [deviceId, true, false, REDEEMABLE_AGE])
  .then(rows => rows.map(toObj))
}
