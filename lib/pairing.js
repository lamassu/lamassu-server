const fs = require('fs')
const pify = require('pify')
const readFile = pify(fs.readFile)
const db = require('./db')
const options = require('./options')
const logger = require('./logger')

// A machine on an older version (no multicassette code) could be paired with a server with multicassette code.
// This makes sure that the server stores a default value
const DEFAULT_NUMBER_OF_CASSETTES = 2 

function pullToken (token) {
  const sql = `delete from pairing_tokens
    where token=$1
    returning name, created < now() - interval '1 hour' as expired`
  return db.one(sql, [token])
}

function unpair (deviceId) {
  // TODO new-admin: We should remove all configs related to that device. This can get tricky.
  return db.tx(t => {
    const q1 = t.none('DELETE FROM devices WHERE device_id=$1', [deviceId])
    const q2 = t.none('DELETE FROM machine_pings WHERE device_id=$1', [deviceId])
    const q3 = t.none('DELETE FROM machine_network_heartbeat WHERE device_id=$1', [deviceId])
    const q4 = t.none('DELETE FROM machine_network_performance WHERE device_id=$1', [deviceId])
    return Promise.all([q1, q2, q3, q4])
  })
}

function pair (token, deviceId, machineModel, numOfCassettes = DEFAULT_NUMBER_OF_CASSETTES) {
  return pullToken(token)
    .then(r => {
      if (r.expired) return false

      const insertSql = `insert into devices (device_id, name, number_of_cassettes) values ($1, $2, $3)
    on conflict (device_id)
    do update set paired=TRUE, display=TRUE`

      return db.none(insertSql, [deviceId, r.name, numOfCassettes])
        .then(() => true)
    })
    .catch(err => {
      logger.debug(err)
      return false
    })
}

function authorizeCaDownload (caToken) {
  return pullToken(caToken)
    .then(r => {
      if (r.expired) throw new Error('Expired')

      const caPath = options.caPath
      return readFile(caPath, {encoding: 'utf8'})
    })
}

function isPaired (deviceId) {
  const sql = 'select device_id, name from devices where device_id=$1 and paired=TRUE'

  return db.oneOrNone(sql, [deviceId])
    .then(row => row && row.device_id === deviceId ? row.name : false)
}

module.exports = {pair, unpair, authorizeCaDownload, isPaired}
