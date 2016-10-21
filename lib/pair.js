const path = require('path')
const db = require('./db')

function pair (token, deviceId) {
  const sql = `delete from pairing_tokens
    where token=$1
    returning created < now() - interval '1 hour' as expired`
  return db.one(sql, [token])
  .then(r => {
    if (r.expired) return false

    const pairSql = 'insert into paired_devices (device_id) values ($1)'
    return db.none(pairSql, [deviceId])
    .then(() => true)
  })
}

function isPaired (deviceId) {
  const sql = 'select device_id from paired_devices where device_id=$1'

  return db.one(sql, [deviceId])
  .then(() => true)
}

module.exports = {totem, pair, unpair, isPaired}
